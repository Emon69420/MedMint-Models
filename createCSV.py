from Bio.PDB.MMCIF2Dict import MMCIF2Dict
import csv
from tqdm import tqdm

# Load the CIF file
cif_dict = MMCIF2Dict('components.cif')

def ensure_list(value):
    if isinstance(value, str):
        return [value]
    return value

ids = ensure_list(cif_dict.get('_chem_comp.id', []))
names = ensure_list(cif_dict.get('_chem_comp.name', []))
formulas = ensure_list(cif_dict.get('_chem_comp.formula', []))
masses = ensure_list(cif_dict.get('_chem_comp.formula_weight', []))
smiles_list = ensure_list(cif_dict.get('_chem_comp.pdbx_type', []))
inchi_list = ensure_list(cif_dict.get('_chem_comp.pdbx_ideal_coordinates_details', []))

with open('basic_info.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['id', 'name', 'formula', 'mass', 'smiles', 'inchi'])

    for i in tqdm(range(len(ids)), desc="Processing components"):
        comp_id = ids[i]
        name = names[i] if i < len(names) else ''
        formula = formulas[i] if i < len(formulas) else ''
        mass = masses[i] if i < len(masses) else ''
        smiles = smiles_list[i] if i < len(smiles_list) else ''
        inchi = inchi_list[i] if i < len(inchi_list) else ''

        writer.writerow([comp_id, name, formula, mass, smiles, inchi])
