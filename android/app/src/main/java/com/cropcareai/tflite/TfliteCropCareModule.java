package com.cropcareai.tflite;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.SystemClock;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.tensorflow.lite.DataType;
import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.Tensor;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class TfliteCropCareModule extends ReactContextBaseJavaModule {
    private static final String TAG = "TfliteCropCare";
    private static final String MODULE_NAME = "TfliteCropCare";
    private static final String MODEL_FILE = "models/plant_disease.tflite";
    private static final String LABELS_FILE = "models/labels.txt";
    private static final int INPUT_WIDTH = 300;
    private static final int INPUT_HEIGHT = 300;
    private static final int INPUT_CHANNELS = 3;
    private static final int NUM_CLASSES = 16;

    private Interpreter interpreter = null;
    private final List<String> labels = new ArrayList<>();
    private float outputScale = 0.00390625f; // 1/256 default
    private int outputZeroPoint = 0;
    private long modelSizeBytes = 0;
    private boolean isInitialized = false;

    public TfliteCropCareModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void initModel(Promise promise) {
        try {
            if (isInitialized && interpreter != null) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("ready", true);
                result.putString("modelName", "plant_disease.tflite");
                result.putInt("labelsCount", labels.size());
                promise.resolve(result);
                return;
            }

            AssetManager assetManager = getReactApplicationContext().getAssets();

            // 1. Read Labels
            labels.clear();
            try (InputStream is = assetManager.open(LABELS_FILE);
                 BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty()) {
                        labels.add(trimmed);
                    }
                }
            }
            Log.i(TAG, "Loaded " + labels.size() + " labels from " + LABELS_FILE);

            // 2. Load TFLite Model
            MappedByteBuffer modelBuffer = loadModelFile(assetManager, MODEL_FILE);
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4);
            interpreter = new Interpreter(modelBuffer, options);

            // 3. Inspect Input Tensor
            Tensor inputTensor = interpreter.getInputTensor(0);
            int[] inputShape = inputTensor.shape();
            DataType inputType = inputTensor.dataType();
            Log.i(TAG, "Input Tensor: shape=" + shapeToString(inputShape) + ", dtype=" + inputType);

            // 4. Inspect Output Tensor
            Tensor outputTensor = interpreter.getOutputTensor(0);
            int[] outputShape = outputTensor.shape();
            DataType outputType = outputTensor.dataType();
            Log.i(TAG, "Output Tensor: shape=" + shapeToString(outputShape) + ", dtype=" + outputType);

            try {
                Tensor.QuantizationParams qParams = outputTensor.quantizationParams();
                if (qParams != null && qParams.getScale() > 0) {
                    outputScale = qParams.getScale();
                    outputZeroPoint = qParams.getZeroPoint();
                    Log.i(TAG, "Output Quantization: scale=" + outputScale + ", zero_point=" + outputZeroPoint);
                }
            } catch (Exception e) {
                Log.w(TAG, "Could not read output quantization params directly, using defaults: " + e.getMessage());
            }

            isInitialized = true;

            WritableMap result = Arguments.createMap();
            result.putBoolean("ready", true);
            result.putString("modelName", "plant_disease.tflite");
            result.putInt("labelsCount", labels.size());
            result.putDouble("modelSizeBytes", (double) modelSizeBytes);
            result.putString("inputType", inputType.toString());
            result.putString("outputType", outputType.toString());

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize TFLite model: " + e.getMessage(), e);
            isInitialized = false;
            promise.reject("INIT_ERROR", "Failed to load TFLite model: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void predict(String imageUriStr, Promise promise) {
        if (!isInitialized || interpreter == null) {
            try {
                // Auto initialize if needed
                initModelSync();
            } catch (Exception e) {
                promise.reject("NOT_INITIALIZED", "Model not initialized: " + e.getMessage());
                return;
            }
        }

        try {
            Uri imageUri = Uri.parse(imageUriStr);
            long prepStart = SystemClock.elapsedRealtime();

            // 1. Decode bitmap with orientation correction
            Bitmap bitmap = decodeBitmapFromUri(imageUri);
            if (bitmap == null) {
                promise.reject("IMAGE_DECODE_FAILED", "Unable to decode image from uri: " + imageUriStr);
                return;
            }

            // 2. Perform Image Quality Check (lightweight)
            WritableMap qualityReport = assessQuality(bitmap);

            // 3. Resize to exact model input: 300x300
            Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmap, INPUT_WIDTH, INPUT_HEIGHT, true);

            // 4. Preprocess into UINT8 direct ByteBuffer [1, 300, 300, 3]
            // STRICT CONTRACT: RGB order, raw UINT8 (0-255), NO /255 division!
            ByteBuffer inputBuffer = ByteBuffer.allocateDirect(INPUT_WIDTH * INPUT_HEIGHT * INPUT_CHANNELS);
            inputBuffer.order(ByteOrder.nativeOrder());
            inputBuffer.rewind();

            int[] pixels = new int[INPUT_WIDTH * INPUT_HEIGHT];
            scaledBitmap.getPixels(pixels, 0, INPUT_WIDTH, 0, 0, INPUT_WIDTH, INPUT_HEIGHT);

            for (int pixelValue : pixels) {
                // Extract R, G, B channels as raw unsigned bytes (0 - 255)
                byte r = (byte) ((pixelValue >> 16) & 0xFF);
                byte g = (byte) ((pixelValue >> 8) & 0xFF);
                byte b = (byte) (pixelValue & 0xFF);

                inputBuffer.put(r);
                inputBuffer.put(g);
                inputBuffer.put(b);
            }

            // 5. Output buffer: [1, 16] UINT8
            ByteBuffer outputBuffer = ByteBuffer.allocateDirect(NUM_CLASSES);
            outputBuffer.order(ByteOrder.nativeOrder());
            outputBuffer.rewind();

            // 6. Run Inference & measure latency
            long inferStart = SystemClock.elapsedRealtime();
            interpreter.run(inputBuffer, outputBuffer);
            long inferDuration = SystemClock.elapsedRealtime() - inferStart;
            long totalPrepDuration = inferStart - prepStart;

            // 7. Dequantize Output to true probabilities
            outputBuffer.rewind();
            byte[] rawBytes = new byte[NUM_CLASSES];
            outputBuffer.get(rawBytes);

            List<PredictionItem> predictionList = new ArrayList<>();
            WritableArray rawValuesArray = Arguments.createArray();

            for (int i = 0; i < NUM_CLASSES; i++) {
                int rawUint8 = rawBytes[i] & 0xFF;
                rawValuesArray.pushInt(rawUint8);

                // Quantization formula: real_value = (quantized_value - zero_point) * scale
                float prob = (rawUint8 - outputZeroPoint) * outputScale;
                if (prob < 0.0f) prob = 0.0f;
                if (prob > 1.0f) prob = 1.0f;

                String label = (i < labels.size()) ? labels.get(i) : ("Class_" + i);
                predictionList.add(new PredictionItem(i, label, prob, rawUint8));
            }

            // Sort descending by confidence
            Collections.sort(predictionList, new Comparator<PredictionItem>() {
                @Override
                public int compare(PredictionItem o1, PredictionItem o2) {
                    return Float.compare(o2.confidence, o1.confidence);
                }
            });

            WritableArray predictionsArray = Arguments.createArray();
            for (int rank = 0; rank < predictionList.size(); rank++) {
                PredictionItem item = predictionList.get(rank);
                WritableMap itemMap = Arguments.createMap();
                itemMap.putInt("index", item.index);
                itemMap.putString("label", item.label);
                itemMap.putDouble("confidence", item.confidence);
                itemMap.putInt("rawUint8", item.rawUint8);
                itemMap.putInt("rank", rank + 1);
                predictionsArray.pushMap(itemMap);
            }

            PredictionItem topItem = predictionList.get(0);
            WritableMap topMap = Arguments.createMap();
            topMap.putInt("index", topItem.index);
            topMap.putString("label", topItem.label);
            topMap.putDouble("confidence", topItem.confidence);
            topMap.putInt("rawUint8", topItem.rawUint8);

            WritableMap response = Arguments.createMap();
            response.putMap("topPrediction", topMap);
            response.putArray("predictions", predictionsArray);
            response.putArray("rawValues", rawValuesArray);
            response.putDouble("inferenceMs", (double) inferDuration);
            response.putDouble("prepMs", (double) totalPrepDuration);
            response.putMap("quality", qualityReport);

            // Clean up temporary bitmaps
            if (scaledBitmap != bitmap && !scaledBitmap.isRecycled()) {
                scaledBitmap.recycle();
            }
            if (!bitmap.isRecycled()) {
                bitmap.recycle();
            }

            promise.resolve(response);

        } catch (Exception e) {
            Log.e(TAG, "Error running inference: " + e.getMessage(), e);
            promise.reject("INFERENCE_ERROR", "Inference failed: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getDiagnostics(Promise promise) {
        try {
            if (!isInitialized || interpreter == null) {
                initModelSync();
            }

            Tensor inputTensor = interpreter.getInputTensor(0);
            Tensor outputTensor = interpreter.getOutputTensor(0);

            WritableMap diag = Arguments.createMap();
            diag.putString("modelFile", "plant_disease.tflite");
            diag.putDouble("modelSizeBytes", (double) modelSizeBytes);
            diag.putString("modelSizeFormatted", String.format("%.2f MB", (double) modelSizeBytes / (1024 * 1024)));

            WritableArray inShapeArr = Arguments.createArray();
            for (int dim : inputTensor.shape()) inShapeArr.pushInt(dim);
            diag.putArray("inputShape", inShapeArr);
            diag.putString("inputType", inputTensor.dataType().toString());

            WritableArray outShapeArr = Arguments.createArray();
            for (int dim : outputTensor.shape()) outShapeArr.pushInt(dim);
            diag.putArray("outputShape", outShapeArr);
            diag.putString("outputType", outputTensor.dataType().toString());

            diag.putInt("labelsCount", labels.size());
            diag.putDouble("outputScale", outputScale);
            diag.putInt("outputZeroPoint", outputZeroPoint);
            diag.putString("runtime", "TensorFlow Lite 2.14.0 (Official Native)");
            diag.putString("status", "READY");

            promise.resolve(diag);
        } catch (Exception e) {
            promise.reject("DIAG_ERROR", "Failed to retrieve diagnostics: " + e.getMessage(), e);
        }
    }

    private void initModelSync() throws Exception {
        AssetManager assetManager = getReactApplicationContext().getAssets();

        labels.clear();
        try (InputStream is = assetManager.open(LABELS_FILE);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty()) {
                    labels.add(trimmed);
                }
            }
        }

        MappedByteBuffer modelBuffer = loadModelFile(assetManager, MODEL_FILE);
        Interpreter.Options options = new Interpreter.Options();
        options.setNumThreads(4);
        interpreter = new Interpreter(modelBuffer, options);

        Tensor outputTensor = interpreter.getOutputTensor(0);
        try {
            Tensor.QuantizationParams qParams = outputTensor.quantizationParams();
            if (qParams != null && qParams.getScale() > 0) {
                outputScale = qParams.getScale();
                outputZeroPoint = qParams.getZeroPoint();
            }
        } catch (Exception ignored) {}

        isInitialized = true;
    }

    private MappedByteBuffer loadModelFile(AssetManager assetManager, String modelPath) throws Exception {
        AssetFileDescriptor fileDescriptor = assetManager.openFd(modelPath);
        modelSizeBytes = fileDescriptor.getLength();
        FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fileDescriptor.getStartOffset();
        long declaredLength = fileDescriptor.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }

    private Bitmap decodeBitmapFromUri(Uri uri) {
        try {
            InputStream input = getReactApplicationContext().getContentResolver().openInputStream(uri);
            if (input == null) return null;

            Bitmap bitmap = BitmapFactory.decodeStream(input);
            input.close();

            if (bitmap == null) return null;

            // Handle EXIF orientation rotation
            int orientation = ExifInterface.ORIENTATION_NORMAL;
            try {
                InputStream exifInput = getReactApplicationContext().getContentResolver().openInputStream(uri);
                if (exifInput != null) {
                    ExifInterface exif = new ExifInterface(exifInput);
                    orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                    exifInput.close();
                }
            } catch (Exception ignored) {}

            int rotationDegrees = 0;
            switch (orientation) {
                case ExifInterface.ORIENTATION_ROTATE_90:
                    rotationDegrees = 90;
                    break;
                case ExifInterface.ORIENTATION_ROTATE_180:
                    rotationDegrees = 180;
                    break;
                case ExifInterface.ORIENTATION_ROTATE_270:
                    rotationDegrees = 270;
                    break;
            }

            if (rotationDegrees != 0) {
                Matrix matrix = new Matrix();
                matrix.postRotate(rotationDegrees);
                Bitmap rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
                if (rotated != bitmap) {
                    bitmap.recycle();
                    bitmap = rotated;
                }
            }

            return bitmap;
        } catch (Exception e) {
            Log.e(TAG, "decodeBitmapFromUri error: " + e.getMessage(), e);
            return null;
        }
    }

    private WritableMap assessQuality(Bitmap bitmap) {
        WritableMap quality = Arguments.createMap();
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();

        quality.putInt("width", width);
        quality.putInt("height", height);

        // Check if extremely small
        boolean validDimensions = (width >= 100 && height >= 100);

        // Sample brightness across 10x10 grid
        int sampleSteps = 10;
        long totalLuminance = 0;
        int count = 0;
        for (int y = 0; y < sampleSteps; y++) {
            int py = (y * height) / sampleSteps;
            for (int x = 0; x < sampleSteps; x++) {
                int px = (x * width) / sampleSteps;
                int pixel = bitmap.getPixel(px, py);
                int r = (pixel >> 16) & 0xFF;
                int g = (pixel >> 8) & 0xFF;
                int b = pixel & 0xFF;
                // Standard perceptual luminance formula
                int lum = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                totalLuminance += lum;
                count++;
            }
        }

        double avgBrightness = (double) totalLuminance / count;
        quality.putDouble("brightness", avgBrightness);

        boolean isTooDark = avgBrightness < 25.0;     // Extremely dark
        boolean isTooBright = avgBrightness > 245.0; // Blown out white
        boolean isAcceptable = validDimensions && !isTooDark && !isTooBright;

        quality.putBoolean("isAcceptable", isAcceptable);
        quality.putBoolean("isTooDark", isTooDark);
        quality.putBoolean("isTooBright", isTooBright);
        quality.putBoolean("validDimensions", validDimensions);

        return quality;
    }

    private String shapeToString(int[] shape) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < shape.length; i++) {
            sb.append(shape[i]);
            if (i < shape.length - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }

    private static class PredictionItem {
        final int index;
        final String label;
        final float confidence;
        final int rawUint8;

        PredictionItem(int index, String label, float confidence, int rawUint8) {
            this.index = index;
            this.label = label;
            this.confidence = confidence;
            this.rawUint8 = rawUint8;
        }
    }
}
