from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes and all origins
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Allow all origins
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/generate-compounds', methods=['POST', 'OPTIONS'])
def generate_compounds():
    if request.method == 'OPTIONS':
        # Preflight request response
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()
        pdb_id = data.get('pdb_id')
        
        if not pdb_id:
            return jsonify({'error': 'No PDB ID provided'}), 400

        # Your compound generation logic here
        # For now, returning dummy data
        result = {
            'reference_smile': 'CC(=O)OC1=CC=CC=C1C(=O)O',
            'generated_smiles': [
                'CC1=CC=C(C=C1)C(=O)O',
                'CC1=CC=CC(=C1)C(=O)O',
                'CC1=CC=CC=C1C(=O)O'
            ]
        }
        
        return jsonify(result)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0') 