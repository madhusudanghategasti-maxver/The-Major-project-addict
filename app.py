import pickle
from flask import Flask, request, jsonify, render_template, url_for 

app = Flask(__name__)
model = pickle.load(open('RFC_model.pkl','rb'))
gender = pickle.load(open('gender.pkl','rb'))
stress = pickle.load(open('stress.pkl','rb')) 
academic = pickle.load(open('academic.pkl','rb')) 


@app.route('/')
def loadPage():
    return render_template('loadingscreen/loading.html')

@app.route('/signup')
def signup():
    return render_template('signup/signup.html')

if __name__ == "__main__":
    app.run(debug=True)



