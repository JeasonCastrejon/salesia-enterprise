def bayes(p_b_given_a: float, p_a: float, p_b: float) -> float:
    return (p_b_given_a * p_a) / p_b
