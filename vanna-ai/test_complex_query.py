"""Test complex vendor risk analysis query"""
import requests
import json

def test_vendor_risk_query():
    """Test the complex vendor risk analysis query"""
    
    url = "http://localhost:8000/ask"
    
    payload = {
        "question": "Create a vendor risk analysis: show vendors with declining invoice volumes, increasing invoice amounts, or irregular payment patterns",
        "execute": False  # Just generate SQL, don't execute
    }
    
    print("🔍 Testing Vendor Risk Analysis Query...")
    print(f"Question: {payload['question']}\n")
    
    try:
        response = requests.post(url, json=payload)
        
        print(f"📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Success: {data.get('success')}")
            
            sql = data.get('sql', '')
            print(f"\n📏 SQL Length: {len(sql)} characters")
            print(f"\n📝 Generated SQL:\n{'-' * 80}")
            print(sql)
            print('-' * 80)
            
            if data.get('error'):
                print(f"\n❌ Error: {data.get('error')}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running on http://localhost:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_vendor_risk_query()
