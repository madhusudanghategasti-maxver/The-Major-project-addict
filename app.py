import pickle
from flask import Flask, request, jsonify, render_template, url_for  # type: ignore


app = Flask(__name__)
model = pickle.load(open('DTCmodel.pkl', 'rb'))
std = pickle.load(open('scaling.pkl','rb'))

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/sign-up')
def signup():
    return render_template("sign-up.html")

@app.route("/prediction")
def form():
    return render_template("prediction.html")



@app.route("/predict_api",methods=['POST'])
def predict_api():
    data = request.json['data']
    print(data)
    print(np.array(list(data.values())).reshape(1,-1))
    new_data = std.transform(np.array(list(data.values())).reshape(1,-1))
    output = model.predict(new_data)
    print(output[0])
    return jsonify(output[0])

@app.route("/predict",methods=['POST'])
def predict():
    data = [float(x) for x in request.form.values()]
    final_input = std.transform(np.array(data).reshape(1,-1))
    print(final_input)
    output = model.predict(final_input)[0]
    if output == 0:
        output = "NO"
    else:
        output = "YES"
    return render_template("form.html",prediction_test='your prediction is {}'.format(output))



if __name__ == "__main__":
    app.run(debug=True)
    
   



