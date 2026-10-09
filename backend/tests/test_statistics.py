from app.statistics.service import mean, median

def test_mean():
    assert mean([10,20,30]) == 20

def test_median_odd():
    assert median([1,8,3]) == 3

def test_median_even():
    assert median([1,2,3,4]) == 2.5
