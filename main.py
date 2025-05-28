from flask import Flask, request, jsonify
import os
import sys

import requests
import ast
import json
import hashlib
import tempfile
import re

from typing import Any
from datetime import datetime
from glob import glob
from io import StringIO

from db import db, arango_graph

import pandas as pd
import numpy as np

from dotenv import load_dotenv
from arango import ArangoClient

from transformers import AutoTokenizer, AutoModel
import torch


from langgraph.checkpoint.memory import MemorySaver
from langchain.llms.bedrock import Bedrock
from langchain_community.chat_models import ChatPerplexity
from langchain_community.graphs import ArangoGraph
from langchain_community.chains.graph_qa.arangodb import ArangoGraphQAChain
from langchain.tools import Tool
from langchain.callbacks.base import BaseCallbackHandler
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage

from pydantic import BaseModel, Field

from Bio.PDB import MMCIFParser

from rdkit import Chem, DataStructs
from rdkit.Chem import MACCSkeys
from rdkit.Chem import Draw, AllChem

import plotly.graph_objects as go
from rdkit import Chem
from rdkit.Chem import AllChem

import networkx as nx
from pyvis.network import Network

from DeepPurpose import utils
from DeepPurpose import DTI as models

from TamGen.TamGen_custom import TamGenCustom
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "origins": "*" ,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})



# Ensure the TamGen directory is in the system path
# Database stuff and TamGen import going on here

sys.path.append(os.path.abspath("./TamGen"))


# Set up the TamGen directory and PDB cache directory
PDB_CACHE_DIR = os.path.abspath("TamGen/scripts/build_data/database/PDBlib")
os.makedirs(PDB_CACHE_DIR, exist_ok=True)

drug_collection = db.collection('drug')
link_collection = db.collection('drug-protein') 

tokenizer = AutoTokenizer.from_pretrained("seyonec/ChemBERTa-zinc-base-v1")
model = AutoModel.from_pretrained("seyonec/ChemBERTa-zinc-base-v1")

worker = TamGenCustom(
    data="./TamGen_Demo_Data",
    ckpt="checkpoints/crossdock_pdb_A10/checkpoint_best.pt",
    use_conditional=True
)

arango_graph = ArangoGraph(db)


#Functions used in the app

#========Generating uids for smiles========
def _GenerateKey(smiles: str) -> str:
    return hashlib.sha256(smiles.encode()).hexdigest()[:24]

#========Get ChemBERTa embeddings for a given SMILES========
def GetChemBERTaEmbeddings(smiles):
    
    print("Getting vector embedding")

    if not isinstance(smiles, str) or not smiles.strip():
        return None 


    inputs = tokenizer(smiles, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    print("Embedding shape:", outputs.last_hidden_state.shape)
    return outputs.last_hidden_state.mean(dim=1).squeeze().tolist()[0]

#========Predict binding affinity using DeepPurpose========
def predict_binding_affinity(X_drug, X_target, y=[7.635]):
    print("Predicting binding affinity: ", X_drug, X_target)
    model = models.model_pretrained(path_dir='DTI_model')
    X_pred = utils.data_process(X_drug, X_target, y,
                                drug_encoding='CNN', 
                                target_encoding='CNN', 
                                split_method='no_split')
    predictions = model.predict(X_pred)
    return predictions[0]


#========Downloading cif files if not present========
def download_cif(pdb_id, save_dir="./database/PDBlib"):
    os.makedirs(save_dir, exist_ok=True)
    cif_path = os.path.join(save_dir, f"{pdb_id.lower()}.cif")
    if os.path.exists(cif_path):
        print(f"CIF file for {pdb_id} already exists.")
        return cif_path
    
    url = f"https://files.rcsb.org/download/{pdb_id.upper()}.cif"
    print(f"Downloading CIF file from {url}")
    response = requests.get(url)
    if response.status_code == 200:
        with open(cif_path, "wb") as f:
            f.write(response.content)
        print(f"Saved CIF file to {cif_path}")
        return cif_path
    else:
        raise FileNotFoundError(f"PDB CIF file for {pdb_id} not found at RCSB PDB.")



#========Sequence of amino acids from PDB file========

def get_amino_acid_sequence_from_pdb(pdb_id):    
    """
    Extracts amino acid sequences from a given PDB structure file in CIF format.

    Args:
        pdb_id (str): pdb id of the protein.

    Returns:
        dict: A dictionary where keys are chain IDs and values are amino acid sequences.
    """

    print("Getting Amino Acid sequence for ", pdb_id)

    cif_file_path = f"./database/PDBlib/{pdb_id.lower()}.cif"

    parser = MMCIFParser(QUIET=True)
    structure = parser.get_structure("protein", cif_file_path)
    
    sequences = {}
    for model in structure:
        for chain in model:
            seq = "".join(residue.resname for residue in chain if residue.id[0] == " ")
            sequences[chain.id] = seq 
            
    return sequences


#====Preparation of data from protein database======#
def prepare_pdb_data(pdb_id):
    """
    Checks if the PDB data for the given PDB ID is available.  
    If not, downloads and processes the data.

    ALWAYS RUN THIS FUNCTION BEFORE WORKING WITH PDB

    Args:
        pdb_id (str): PDB ID of the target structure.

    """

    DemoDataFolder="TamGen_Demo_Data"
    ligand_inchi=None
    thr=10

    
    out_split = pdb_id.lower()
    FF = glob(f"{DemoDataFolder}/*")
    for ff in FF:
        if f"gen_{out_split}" in ff:
            print(f"{pdb_id} is downloaded")
            return
    
    os.makedirs(DemoDataFolder, exist_ok=True)
    
    with open("tmp_pdb.csv", "w") as fw:
        if ligand_inchi is None:
            print("pdb_id", file=fw)
            print(f"{pdb_id}", file=fw)
        else:
            print("pdb_id,ligand_inchi", file=fw)
            print(f"{pdb_id},{ligand_inchi}", file=fw)

    script_path = os.path.abspath("TamGen/scripts/build_data/prepare_pdb_ids.py")
    os.system(f"python {script_path} tmp_pdb.csv gen_{out_split} -o {DemoDataFolder} -t {thr}")
    os.remove("tmp_pdb.csv")



#=======compound generation function=========

def generate_compounds(pdb_id, num_samples=10, max_seed=30):
    """
    Generates and sorts compounds based on similarity to a reference molecule. 
    All generated compounds are added to ArangoDB.

    Returns:
    - dict with 'generated_smiles', 'reference', etc.
    """

    print("Generating Compounds for PDB:", pdb_id)
    try:
        # Step 1: Prepare PDB data
        prepare_pdb_data(pdb_id)

        # Step 2: Reload into TamGen
        worker.reload_data(subset=f"gen_{pdb_id.lower()}")

        # Step 3: Generate
        print(f"Generating {num_samples} compounds...")
        generated_mols, reference_mol = worker.sample(
            m_sample=num_samples,
            maxseed=max_seed
        )
        print(f"Generated molecules count: {len(generated_mols) if generated_mols else 0}")
        print(f"Reference molecule: {reference_mol}")

        # Step 4: Sort by similarity
        if reference_mol:
            if isinstance(reference_mol, str):
                reference_mol = Chem.MolFromSmiles(reference_mol)

            fp_ref = MACCSkeys.GenMACCSKeys(reference_mol)

            gens = []
            for mol in generated_mols:
                if isinstance(mol, str):
                     mol = Chem.MolFromSmiles(mol)
                if mol:
                    fp = MACCSkeys.GenMACCSKeys(mol)
                    similarity = DataStructs.FingerprintSimilarity(fp_ref, fp)
                    gens.append((mol, similarity))

            sorted_mols = [mol for mol, _ in sorted(gens, key=lambda e: e[1], reverse=True)]

        else:
                sorted_mols = generated_mols

        # Step 5: conversio  to smiles
        generated_smiles = [Chem.MolToSmiles(mol) for mol in sorted_mols if mol]
        reference_smile = Chem.MolToSmiles(reference_mol)

        

        return {
            "generated": sorted_mols,
            "reference": reference_mol,
            "reference_smile": reference_smile,
            "generated_smiles": generated_smiles
        }

    except Exception as e:
        print(f"Error during generation: {str(e)}")
        return {"error": str(e)}


#===========NLP → AQL Logic============
def text_to_aql(natural_query):

    llm = ChatPerplexity(
    model="sonar",  
    temperature=0,
    api_key="Your Perplexity API Key Here"  # Replace with your Perplexity API key
    )

    chain = ArangoGraphQAChain.from_llm(
        llm=llm,
        graph=arango_graph,
        verbose=True,
        allow_dangerous_requests=True
    )

    
    result = chain.invoke(natural_query)
    print("Chain result:", result)

    
    return str(result.get("result", None))


#Endpoints for the app

@app.route('/')
def index():
    return "Welcome to the Flask app!"

@app.route('/generate-compounds', methods=['POST'])
def generate_compounds_endpoint():
    data = request.get_json()
    if not data or 'pdb_id' not in data:
        return jsonify({"error": "Missing 'pdb_id' in request body"}), 400

    pdb_id = data['pdb_id']
    num_samples = data.get('num_samples', 5)
    max_seed = data.get('max_seed', 30)

    result = generate_compounds(pdb_id, num_samples=num_samples, max_seed=max_seed)

    if "error" in result:
        return jsonify(result), 500

    return jsonify({
        "generated_smiles": result.get("generated_smiles", []),
        "reference_smile": result.get("reference_smile", ""),
        "pdb_id": pdb_id
    })
    



@app.route('/similar-drugs', methods=['POST'])
def similar_drugs():
    data = request.get_json()

    if not data or 'smile' not in data:
        return jsonify({"error": "Missing 'smile' in request body"}), 400

    smile = data['smile']
    top_k = data.get('top_k', 5)

    try:
        print("Finding similar drugs...")

        embedding = GetChemBERTaEmbeddings(smile)
        if embedding is None:
            return jsonify({"error": "Invalid SMILES provided."}), 400

        aql_query = """
        LET query_vector = @query_vector
        FOR doc IN drug
            LET score = COSINE_SIMILARITY(doc.embedding, query_vector)
            SORT score DESC
            LIMIT @top_k
            RETURN { drug: doc._key, similarity_score: score }
        """

        cursor = db.aql.execute(
            aql_query,
            bind_vars={"query_vector": embedding, "top_k": top_k}
        )

        return jsonify(list(cursor))

    except Exception as e:
        print("Error in /similar-drugs:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/pdb-sequence', methods=['GET'])
def pdb_sequence_endpoint():
    pdb_id = request.args.get('pdb_id')
    if not pdb_id:
        return jsonify({"error": "Missing 'pdb_id' parameter"}), 400

    try:
        # Download CIF file if not present
        download_cif(pdb_id)
        sequences = get_amino_acid_sequence_from_pdb(pdb_id)
        return jsonify({"pdb_id": pdb_id, "sequences": sequences})
    except FileNotFoundError as fnf_err:
        return jsonify({"error": str(fnf_err)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/predict-binding-affinity', methods=['POST'])
def predict_binding_affinity_endpoint():
    data = request.get_json()
    if not data or 'smile' not in data or 'target_sequence' not in data:
        return jsonify({"error": "Missing 'smile' or 'target_sequence' in JSON"}), 400

    smile = data['smile']
    target_sequence = data['target_sequence']

    try:
        affinity = predict_binding_affinity([smile], [target_sequence])
        return jsonify({"predicted_binding_affinity": float(affinity)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/natural-to-aql', methods=['POST'])
def handle_natural_to_aql():
    data = request.get_json()
    query = data.get("query")
    print("Received query:", query)
    if not query:
        return jsonify({"error": "Missing 'query' in request body"}), 400

    try:
        aql = text_to_aql(query)
        return jsonify({"aql": aql})
    except Exception as e:
        return jsonify({"error": str(e)}), 500





if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
