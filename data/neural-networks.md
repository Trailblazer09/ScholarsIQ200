# Introduction to Neural Networks

## What Is a Neural Network?
An artificial neural network is a computing system loosely inspired by the biological neural networks in animal brains. It consists of layers of interconnected nodes, or "neurons", that process information. Neural networks are a core technology behind modern machine learning and are used for tasks such as image recognition, language translation, and speech processing.

## Structure: Layers and Neurons
A typical neural network has three kinds of layers. The input layer receives the raw data. One or more hidden layers perform intermediate computations. The output layer produces the final result. Each connection between neurons has a weight, and each neuron applies an activation function to decide how strongly it fires. Networks with many hidden layers are called "deep" neural networks, which is where the term deep learning comes from.

## How Learning Happens: Training
Neural networks learn from data through a process called training. The network makes a prediction, and a loss function measures how far the prediction is from the correct answer. An algorithm called backpropagation calculates how each weight contributed to the error, and gradient descent adjusts the weights to reduce the error. Repeating this over many examples gradually improves the network's accuracy.

## Activation Functions
Activation functions introduce non-linearity, allowing networks to learn complex patterns. Common choices include the sigmoid function, which squashes values between 0 and 1; ReLU (rectified linear unit), which outputs zero for negatives and the input value for positives; and softmax, often used in the output layer for classification tasks. Without non-linear activations, a deep network would behave like a single linear layer.

## Applications and Limitations
Neural networks power image classifiers, recommendation systems, and large language models. However, they require large amounts of data and computation to train, can be difficult to interpret, and may reflect biases present in their training data. Understanding these limitations is important when applying them responsibly.
