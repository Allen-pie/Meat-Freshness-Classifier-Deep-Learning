import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from flask import Flask, request
from flask_cors import CORS
import io
from huggingface_hub import hf_hub_download

app = Flask(__name__)
CORS(app, resources={
    r"/classify-freshness" : {
        "origins" : ["https://allen-pie.github.io"]
    }
})

# Model is stored in hugging face repo because of size limit in deployment
MODEL_PATH = hf_hub_download(
    repo_id="ayaMee/meat-freshness-classifier-mobilenetv2",
    filename="MobileNetV2_FINETUNED_13.keras"
)
CLASS_NAMES = ["Fresh", "Spoiled"]

def preprocessImage(img, target_size=(224,224)):
    # either save it temp or convert to io.Bytesio
    img_bytes = img.read()
    
    preprocess = io.BytesIO(img_bytes)
    preprocess = image.load_img(preprocess, target_size=target_size)
    
    preprocess = image.img_to_array(preprocess)
    preprocess = preprocess_input(preprocess)
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