package com.cropcareai.database;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

public class CropCareDatabaseModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CropCareDatabase";
    private static final String MODULE_NAME = "CropCareDatabase";
    private static final String DB_NAME = "cropcare.db";
    private static final int DB_VERSION = 1;

    private CropCareDbHelper dbHelper;
    private SQLiteDatabase database;

    public CropCareDatabaseModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public synchronized void openDatabase(Promise promise) {
        try {
            if (database != null && database.isOpen()) {
                WritableMap res = Arguments.createMap();
                res.putBoolean("opened", true);
                res.putString("dbName", DB_NAME);
                promise.resolve(res);
                return;
            }

            dbHelper = new CropCareDbHelper(getReactApplicationContext());
            database = dbHelper.getWritableDatabase();

            Log.i(TAG, "Opened SQLite database: " + DB_NAME + " at path: " + database.getPath());

            WritableMap res = Arguments.createMap();
            res.putBoolean("opened", true);
            res.putString("dbName", DB_NAME);
            res.putString("path", database.getPath());
            promise.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open database: " + e.getMessage(), e);
            promise.reject("DB_OPEN_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public synchronized void executeSql(String sql, ReadableArray args, Promise promise) {
        if (database == null || !database.isOpen()) {
            dbHelper = new CropCareDbHelper(getReactApplicationContext());
            database = dbHelper.getWritableDatabase();
        }

        try {
            Object[] bindArgs = toObjectArray(args);
            if (bindArgs.length > 0) {
                database.execSQL(sql, bindArgs);
            } else {
                database.execSQL(sql);
            }
            WritableMap res = Arguments.createMap();
            res.putBoolean("success", true);
            promise.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "executeSql error for [" + sql + "]: " + e.getMessage(), e);
            promise.reject("SQL_EXEC_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public synchronized void query(String sql, ReadableArray args, Promise promise) {
        if (database == null || !database.isOpen()) {
            dbHelper = new CropCareDbHelper(getReactApplicationContext());
            database = dbHelper.getWritableDatabase();
        }

        Cursor cursor = null;
        try {
            String[] selectionArgs = toStringArray(args);
            cursor = database.rawQuery(sql, selectionArgs);

            WritableArray rows = Arguments.createArray();
            String[] columnNames = cursor.getColumnNames();

            while (cursor.moveToNext()) {
                WritableMap row = Arguments.createMap();
                for (int i = 0; i < columnNames.length; i++) {
                    String col = columnNames[i];
                    int type = cursor.getType(i);
                    switch (type) {
                        case Cursor.FIELD_TYPE_NULL:
                            row.putNull(col);
                            break;
                        case Cursor.FIELD_TYPE_INTEGER:
                            row.putDouble(col, cursor.getLong(i));
                            break;
                        case Cursor.FIELD_TYPE_FLOAT:
                            row.putDouble(col, cursor.getDouble(i));
                            break;
                        case Cursor.FIELD_TYPE_STRING:
                            row.putString(col, cursor.getString(i));
                            break;
                        case Cursor.FIELD_TYPE_BLOB:
                            row.putString(col, "[BLOB]");
                            break;
                    }
                }
                rows.pushMap(row);
            }

            promise.resolve(rows);
        } catch (Exception e) {
            Log.e(TAG, "query error for [" + sql + "]: " + e.getMessage(), e);
            promise.reject("SQL_QUERY_ERROR", e.getMessage(), e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    @ReactMethod
    public synchronized void executeBatch(ReadableArray statements, Promise promise) {
        if (database == null || !database.isOpen()) {
            dbHelper = new CropCareDbHelper(getReactApplicationContext());
            database = dbHelper.getWritableDatabase();
        }

        database.beginTransaction();
        try {
            for (int i = 0; i < statements.size(); i++) {
                ReadableMap item = statements.getMap(i);
                String sql = item.getString("sql");
                ReadableArray args = item.hasKey("args") ? item.getArray("args") : null;
                Object[] bindArgs = toObjectArray(args);

                if (bindArgs.length > 0) {
                    database.execSQL(sql, bindArgs);
                } else {
                    database.execSQL(sql);
                }
            }
            database.setTransactionSuccessful();
            WritableMap res = Arguments.createMap();
            res.putBoolean("success", true);
            res.putInt("count", statements.size());
            promise.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "executeBatch error: " + e.getMessage(), e);
            promise.reject("BATCH_ERROR", e.getMessage(), e);
        } finally {
            database.endTransaction();
        }
    }

    private Object[] toObjectArray(ReadableArray args) {
        if (args == null) return new Object[0];
        Object[] arr = new Object[args.size()];
        for (int i = 0; i < args.size(); i++) {
            ReadableType type = args.getType(i);
            switch (type) {
                case Null:
                    arr[i] = null;
                    break;
                case Boolean:
                    arr[i] = args.getBoolean(i) ? 1 : 0;
                    break;
                case Number:
                    double num = args.getDouble(i);
                    if (num == Math.floor(num) && !Double.isInfinite(num)) {
                        arr[i] = (long) num;
                    } else {
                        arr[i] = num;
                    }
                    break;
                case String:
                    arr[i] = args.getString(i);
                    break;
                default:
                    arr[i] = args.getString(i);
                    break;
            }
        }
        return arr;
    }

    private String[] toStringArray(ReadableArray args) {
        if (args == null || args.size() == 0) return null;
        String[] arr = new String[args.size()];
        for (int i = 0; i < args.size(); i++) {
            ReadableType type = args.getType(i);
            switch (type) {
                case Null:
                    arr[i] = null;
                    break;
                case Boolean:
                    arr[i] = String.valueOf(args.getBoolean(i) ? 1 : 0);
                    break;
                case Number:
                    double num = args.getDouble(i);
                    if (num == Math.floor(num) && !Double.isInfinite(num)) {
                        arr[i] = String.valueOf((long) num);
                    } else {
                        arr[i] = String.valueOf(num);
                    }
                    break;
                case String:
                    arr[i] = args.getString(i);
                    break;
                default:
                    arr[i] = args.getString(i);
                    break;
            }
        }
        return arr;
    }

    private static class CropCareDbHelper extends SQLiteOpenHelper {
        CropCareDbHelper(Context context) {
            super(context, DB_NAME, null, DB_VERSION);
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            // Tables created dynamically by schema migrations
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            // Handle schema version upgrade if necessary
        }
    }
}
