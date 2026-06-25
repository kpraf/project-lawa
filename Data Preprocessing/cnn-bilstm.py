import pandas as pd
import numpy as np
import os
import random
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Dropout, Flatten, Dense, Bidirectional, LSTM
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
import keras_tuner as kt
import tensorflow as tf
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score



seed = 42
os.environ["PYTHONHASHSEED"] = str(seed)
random.seed(seed)
np.random.seed(seed)
tf.random.set_seed(seed)


results_dir = "cnn_bilstm_station_results_final"
os.makedirs(results_dir, exist_ok=True)



df = pd.read_csv("group2_interpolated_complete.csv")
df["Month"] = pd.to_datetime(df["Month"])
station = "Stn. XXIII (Lumban)"


features = [
    "BOD (mg/L)", "Dissolved Oxygen (mg/L)",
    "Fecal Coliform, MPN/100ml (Geomean)", "pH (units)",
    "Ammonia (mg/L)", "Nitrate (mg/L)", "Inorganic Phospate (mg/L)"
]


def create_sequences(data, window_size):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i + window_size])
        y.append(data[i + window_size])
    return np.array(X), np.array(y)
    
    
    
station_df = df[df["Stations"] == station].sort_values("Month")
data = station_df[features].values

scaler = MinMaxScaler()
data_scaled = scaler.fit_transform(data)

timesteps = 12
X, y = create_sequences(data_scaled, timesteps)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
timesteps, features_dim = X_train.shape[1], X_train.shape[2]



def build_model(hp):

    model = Sequential()

    for i in range(hp.Int("num_conv_layers", 1, 3)):
        filters = hp.Int(f"filters_{i}", 8, 256, step=32)
        kernel_size = hp.Choice(f"kernel_size_{i}", [1, 2, 3])
        if i == 0:
            model.add(Conv1D(filters, kernel_size, activation="relu", input_shape=(timesteps, features_dim)))
        else:
            model.add(Conv1D(filters, kernel_size, activation="relu"))

    model.add(MaxPooling1D(pool_size=2))
    

    num_bilstm_layers = hp.Int("num_bilstm_layers", 1, 3)
    for i in range(num_bilstm_layers):
        units = hp.Int(f"bilstm_units_{i}", 8, 256, step=64)
        return_seq = i < num_bilstm_layers - 1
        model.add(Bidirectional(LSTM(units, return_sequences=return_seq)))

    model.add(Dropout(hp.Float("dropout", 0.1, 0.5, step=0.1)))

    for i in range(hp.Int("num_dense_layers", 1,3)):
        units = hp.Int(f"dense_units_{i}", 8, 256, step=64)
        model.add(Dense(units, activation="relu"))

    model.add(Dense(7))  # 7 Outputs

    model.compile(
        optimizer=Adam(hp.Float("lr", 1e-4, 1e-2, sampling="log")),
        loss="mse",
        metrics=["mae"]
    )
    return model


class MyTuner(kt.RandomSearch):
    def run_trial(self, trial, *args, **kwargs):
        hp = trial.hyperparameters
        kwargs["batch_size"] = hp.Choice("batch_size", [4, 8, 16, 24, 32])
        return super().run_trial(trial, *args, **kwargs)

tuner = MyTuner(
    build_model,
    objective="val_loss",
    max_trials=40,
    executions_per_trial=1,
    directory="kt_cnn_bilstm_final",
    project_name=f"cnn_bilstm_{station.replace(' ', '_').replace('.', '')}",
    seed=seed
)



early_stop = EarlyStopping(patience=30, restore_best_weights=True)


tuner.search(
    X_train, y_train,
    validation_split=0.2,
    epochs=500,
    callbacks=[early_stop],
)


results = []
trials = tuner.oracle.get_best_trials(num_trials=1000)

for trial in trials:
    try:
        val_mae = trial.metrics.get_last_value("val_mae")
        val_loss = trial.metrics.get_last_value("val_loss")
    except (KeyError, ValueError, TypeError):
        continue

    trial_data = trial.hyperparameters.values.copy()
    batch_size = trial.hyperparameters.get("batch_size")
    trial_data["batch_size"] = batch_size
    trial_data["val_mae"] = val_mae
    trial_data["val_loss"] = val_loss
    trial_data["status"] = trial.status
    trial_data["station"] = station
    results.append(trial_data)

trial_df = pd.DataFrame(results)
station_id = station.replace(" ", "_").replace(".", "")
trial_df.to_csv(f"{results_dir}/{station_id}_trials.csv", index=False)
print(f"📄 Trials saved: {results_dir}/{station_id}_trials.csv")


best_model = tuner.get_best_models(1)[0]
best_model.save(f"{results_dir}/{station_id}_best_model.keras")

y_pred = best_model.predict(X_test)
metrics = []
mae_list, rmse_list, r2_list = [], [], []

for i, col in enumerate(features):
    mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
    rmse = np.sqrt(mean_squared_error(y_test[:, i], y_pred[:, i]))
    r2 = r2_score(y_test[:, i], y_pred[:, i])

    metrics.append({
        "Parameter": col,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    mae_list.append(mae)
    rmse_list.append(rmse)
    r2_list.append(r2)

#Convert to DataFrame
metrics_df = pd.DataFrame(metrics)

#Compute average
average_metrics = {
    "Parameter": "Average",
    "MAE": np.mean(mae_list),
    "RMSE": np.mean(rmse_list),
    "R2": np.mean(r2_list)
}
metrics_df = pd.concat([metrics_df, pd.DataFrame([average_metrics])], ignore_index=True)

#Save to CSV
metrics_file = os.path.join(results_dir, f"{station_id}_evaluation_metrics.csv")
metrics_df.to_csv(metrics_file, index=False)

print(f"📊 Metrics (with averages) saved to: {metrics_file}")