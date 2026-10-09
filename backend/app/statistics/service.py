import numpy as np
import pandas as pd

def mean(values):
    arr = np.array(values, dtype=float)
    return float(np.mean(arr))

def median(values):
    arr = np.array(values, dtype=float)
    return float(np.median(arr))

def describe(values):
    s = pd.Series(values, dtype="float64")
    return {
        "count": int(s.count()),
        "min": float(s.min()),
        "max": float(s.max()),
        "mean": float(s.mean()),
        "median": float(s.median()),
        "sum": float(s.sum())
    }
