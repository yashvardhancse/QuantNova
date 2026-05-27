import pytest
from app.indicators import calculate_atr


class TestATRIndicator:

    def test_atr_basic_calculation(self):
        data = [
            {"high": 105, "low": 98, "close": 103},
            {"high": 107, "low": 100, "close": 106},
            {"high": 109, "low": 102, "close": 105},
            {"high": 110, "low": 103, "close": 108},
            {"high": 112, "low": 105, "close": 111},
            {"high": 115, "low": 108, "close": 113},
            {"high": 117, "low": 110, "close": 115},
            {"high": 118, "low": 112, "close": 116},
            {"high": 120, "low": 114, "close": 119},
            {"high": 122, "low": 116, "close": 120},
            {"high": 123, "low": 117, "close": 121},
            {"high": 125, "low": 119, "close": 124},
            {"high": 126, "low": 120, "close": 125},
            {"high": 128, "low": 122, "close": 127},
        ]
        
        result = calculate_atr(data, period=14)
        
        assert len(result) == len(data)
        assert all(isinstance(val, (int, float)) for val in result)
        assert all(val >= 0 for val in result)  # ATR is always positive

    def test_atr_insufficient_data(self):
        data = [
            {"high": 105, "low": 98, "close": 103},
            {"high": 107, "low": 100, "close": 106},
        ]
        
        with pytest.raises(ValueError, match="Insufficient data"):
            calculate_atr(data, period=14)

    def test_atr_missing_keys(self):
        data = [
            {"high": 105, "low": 98},  # Missing 'close'
            {"high": 107, "low": 100, "close": 106},
        ]
        
        with pytest.raises(ValueError, match="must contain"):
            calculate_atr(data, period=2)

    def test_atr_custom_period(self):
        data = [
            {"high": 105, "low": 98, "close": 103},
            {"high": 107, "low": 100, "close": 106},
            {"high": 109, "low": 102, "close": 105},
            {"high": 110, "low": 103, "close": 108},
            {"high": 112, "low": 105, "close": 111},
        ]
        
        result = calculate_atr(data, period=5)
        
        assert len(result) == len(data)
        assert result[-1] > 0  

    def test_atr_high_volatility(self):
        data = [
            {"high": 100, "low": 90, "close": 95},
            {"high": 120, "low": 95, "close": 110},
            {"high": 140, "low": 110, "close": 130},
            {"high": 130, "low": 100, "close": 115},
            {"high": 150, "low": 115, "close": 140},
        ]
        
        result = calculate_atr(data, period=5)
        assert result[-1] > 10

    def test_atr_low_volatility(self):
        data = [
            {"high": 100, "low": 99, "close": 99.5},
            {"high": 100.5, "low": 99.5, "close": 100},
            {"high": 101, "low": 100, "close": 100.5},
            {"high": 101.5, "low": 100.5, "close": 101},
            {"high": 102, "low": 101, "close": 101.5},
        ]
        
        result = calculate_atr(data, period=5)
        assert result[-1] < 2

    def test_atr_values_increase_with_volatility(self):
        data = [
            {"high": 100, "low": 99, "close": 99.5},
            {"high": 100.5, "low": 99.5, "close": 100},
            {"high": 101, "low": 100, "close": 100.5},
            {"high": 103, "low": 100, "close": 102}, 
            {"high": 106, "low": 102, "close": 105}, 
        ]
        
        result = calculate_atr(data, period=5)
        assert result[-1] > result[2]

    def test_atr_endpoint(self, client):
        data = [
            {"high": 105, "low": 98, "close": 103},
            {"high": 107, "low": 100, "close": 106},
            {"high": 109, "low": 102, "close": 105},
            {"high": 110, "low": 103, "close": 108},
            {"high": 112, "low": 105, "close": 111},
            {"high": 115, "low": 108, "close": 113},
            {"high": 117, "low": 110, "close": 115},
            {"high": 118, "low": 112, "close": 116},
            {"high": 120, "low": 114, "close": 119},
            {"high": 122, "low": 116, "close": 120},
            {"high": 123, "low": 117, "close": 121},
            {"high": 125, "low": 119, "close": 124},
            {"high": 126, "low": 120, "close": 125},
            {"high": 128, "low": 122, "close": 127},
        ]
        
        response = client.post(
            "/api/indicators/atr",
            json={"data": data, "period": 14}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "atr_values" in result
        assert "period" in result
        assert result["period"] == 14
        assert len(result["atr_values"]) == len(data)

    def test_atr_endpoint_invalid_period(self, client):
        """Test ATR endpoint with invalid period."""
        data = [{"high": 105, "low": 98, "close": 103}]
        
        response = client.post(
            "/api/indicators/atr",
            json={"data": data, "period": 14}
        )
        
        assert response.status_code == 400

    def test_atr_zero_volatility(self):
        data = [
            {"high": 100, "low": 100, "close": 100},
            {"high": 100, "low": 100, "close": 100},
            {"high": 100, "low": 100, "close": 100},
            {"high": 100, "low": 100, "close": 100},
            {"high": 100, "low": 100, "close": 100},
        ]
        
        result = calculate_atr(data, period=5)
        assert all(val == 0 for val in result)
