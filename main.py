import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from flask import Flask, request
from flask_cors import CORS
import io

app = Flask(__name__)
CORS(app)


MODEL_PATH = './ResNet_FINETUNING.keras'
# {' Fresh': 0, ' Half-Fresh': 1, ' Spoiled': 2}
CLASS_NAMES = ["Fresh", "Half-Fresh", "Spoiled"]

def preprocessImage(img, target_size=(224,224)):
    # either save it temp or convert to io.Bytesio
    preprocess = io.BytesIO(img.read())
    preprocess = image.load_img(preprocess, target_size=target_size)
    preprocess = image.img_to_array(preprocess)
    preprocess = preprocess.astype('float32') / 255.0
    preprocess = np.expand_dims(preprocess, axis=0)
    return preprocess
    

@app.route('/classify-freshness', methods=['POST'])
def classifyImage():
        
    if 'image' not in request.files:
        return {"error": "No image uploaded"}, 400

    image = request.files['image']
    preprocessed = preprocessImage(image)
    model = load_model(MODEL_PATH)
    prediction = model.predict(preprocessed)
    label =  CLASS_NAMES[np.argmax(prediction)]
       
    return {"class_label": label }, 200
    
if __name__ == '__main__':
    app.run(debug=True)

