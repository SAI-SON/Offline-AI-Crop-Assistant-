#!/usr/bin/env python3
"""
Model Inspection and Validation Script for CropCare AI
======================================================
Prints input/output tensor shapes, datatypes, and quantization metadata
to ensure the mobile application's preprocessing and inference contract
strictly matches the underlying TensorFlow Lite model.
"""

import os
import sys

def inspect_model(model_path: str, labels_path: str = None):
    print("==================================================")
    print(" CropCare AI - TFLite Model Contract Inspection")
    print("==================================================")
    print(f"Target Model: {model_path}")
    
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at {model_path}")
        sys.exit(1)
        
    model_size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"Model File Size: {model_size_mb:.2f} MB")

    try:
        import tensorflow as tf
        interpreter = tf.lite.Interpreter(model_path=model_path)
    except ImportError:
        try:
            import tflite_runtime.interpreter as tflite
            interpreter = tflite.Interpreter(model_path=model_path)
        except ImportError:
            print("ERROR: Neither tensorflow nor tflite_runtime is installed.")
            sys.exit(1)

    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print("\n--- INPUT TENSOR METADATA ---")
    for i, inp in enumerate(input_details):
        print(f"Input [{i}]:")
        print(f"  Name:         {inp['name']}")
        print(f"  Shape:        {inp['shape'].tolist()}")
        print(f"  Dtype:        {inp['dtype'].__name__}")
        print(f"  Quantization: scale = {inp['quantization'][0]}, zero_point = {inp['quantization'][1]}")
        print(f"  Details:      {inp['quantization_parameters']}")

    print("\n--- OUTPUT TENSOR METADATA ---")
    for i, out in enumerate(output_details):
        print(f"Output [{i}]:")
        print(f"  Name:         {out['name']}")
        print(f"  Shape:        {out['shape'].tolist()}")
        print(f"  Dtype:        {out['dtype'].__name__}")
        print(f"  Quantization: scale = {out['quantization'][0]}, zero_point = {out['quantization'][1]}")
        print(f"  Details:      {out['quantization_parameters']}")

    if labels_path and os.path.exists(labels_path):
        with open(labels_path, 'r', encoding='utf-8') as f:
            labels = [line.strip() for line in f if line.strip()]
        print("\n--- LABELS METADATA ---")
        print(f"Total Labels:   {len(labels)}")
        print(f"Output Classes: {output_details[0]['shape'][-1]}")
        assert len(labels) == output_details[0]['shape'][-1], "Mismatch between labels count and model output shape!"
        print("  [OK] Labels count exactly matches output classes count.")
        for idx, label in enumerate(labels):
            print(f"  [{idx:02d}] {label}")

    print("\n--- SUMMARY OF PREPROCESSING CONTRACT ---")
    print("  * Expected Input Resolution: 300 x 300")
    print("  * Color Format: RGB")
    print("  * Data Type: UINT8 (range 0 - 255)")
    print("  * Normalization: NONE (Do NOT divide by 255)")
    print("  * Output Probability: prob = (quantized_value - zero_point) * scale")
    print("==================================================")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'assets', 'models', 'plant_disease.tflite')
    labels_path = os.path.join(base_dir, 'assets', 'models', 'labels.txt')
    inspect_model(model_path, labels_path)
