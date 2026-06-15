def WaterQuality(sensor, data):
    def pH(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}

        if value >= 6.5 and value <= 8.5:
            return {"Class": "Class A-B", "Color": "Green", "Range": "Greater than or equal to 6.5 and less than or equal to 8.5"}

        elif value >= 6.5 and value <= 9.0:
            return {"Class": "Class C", "Color": "Yellow", "Range": "Greater than or equal to 6.5 and less than or equal to 9.0"}
        
        elif value >= 6.0 and value <= 9.0:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than or equal to 6.0 and less than or equal to 9.0"}
        
        
        return {"Class": "Failed", "Color": "Red", "Range": "Less than 6.0 or greater than 9.0"}


    def DO(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        

        if value >= 5:
            return {"Class": "Class AA-C", "Color": "Green", "Range": "Greater than or equal to 5mg/L"}
        
        elif value < 5 and value >= 2:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than or equal to 2mg/L and less than 5mg/L"}
        
        
        return {"Class": "Failed", "Color": "Red", "Range": "Less than 2mg/L"}


    def TDS(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}

        if value <= 500:
            return {"Class": "Class AA-B", "Color": "Green", "Range": "Less than 500ppm"}
        
        if value <= 1000:
            return {"Class": "Class C", "Color": "Yellow", "Range": "Greater than 500ppm and less than or equal to 1000ppm"}
        
        if value <= 1500:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than 1000ppm and less than or equal to 1500ppm"}

        
        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 1500ppm"}


    def Turbidity(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value <= 5:
            return {"Class": "Class AA-B", "Color": "Green", "Range": "Less than or equal to 5NTU"}
        
        if value <= 10:
            return {"Class": "Class C", "Color": "Yellow", "Range": "Greater than 5NTU and less than or equal to 10NTU"}
        
        if value <= 15:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than 10NTU and less than or equal to 15NTU"}

        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 15NTU"}  
    

    def ORP(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value >= 300:
            return {"Class": "Class AA-A", "Color": "Green", "Range": "Greater than or equal to 300mV"}
        
        if value >= 250:
            return {"Class": "Class B", "Color": "Yellow Green", "Range": "Greater than or equal to 250mV and less than 300mV"}
        
        if value  >= 200:
            return {"Class": "Class C", "Color": "Yellow", "Range": "Greater than or equal to 200mV and less than 250mV"}
        
        if value >= 150:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than or equal to 150mV and less than 200mV"}
        
        return {"Class": "Failed", "Color": "Red", "Range": "Less than 150mV"}
    

    def Temperature(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value >= 26 and value <= 30:
            return {"Class": "Class AA-C", "Color": "Green", "Range": "Greater than or equal to 26°C and less than or equal to 30°C"}
        
        if value >= 25 and value <= 31:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than or equal to 25°C and less than or equal to 31°C"}

        return {"Class": "Failed", "Color": "Red", "Range": "Less than 25°C or greater than 31°C"}  
    
    def BOD(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value < 3:
            return {"Class": "Class AA", "Color": "Blue", "Range": "Less than or equal to 3mg/L"}
        
        if value < 5:
            return {"Class": "Class A", "Color": "Green", "Range": "Greater than or equal to 3mg/L and less than or equal to 5mg/L"}
        
        if value < 7:
            return {"Class": "Class B", "Color": "Yellow Green", "Range": "Greater than or equal to 5mg/L and less than or equal to 7mg/L"}
        
        if value < 10:
            return {"Class": "Class C", "Color": "Yellow", "Range": "Greater than or equal to 7mg/L and less than or equal to 10mg/L"}
        
        if value < 15:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than or equal to 10mg/L and less than or equal to 15mg/L"}
        
        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 15mg/L"}

    def InorganicPhosphate(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value <= 0.025:
            return {"Class": "Class AA-C", "Color": "Green", "Range": "Less than 0.025mg/L or equal to 0.025mg/L"}
        
        if value <= 0.5:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than 0.025mg/L and less than or equal to 0.5mg/L"}
        
        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 0.5mg/L"}
    
    def Ammonia(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value <= 0.06:
            return {"Class": "Class AA-C", "Color": "Green", "Range": "Less than or equal to 0.06mg/L"}
        
        if value <= 0.30:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than 0.06mg/L and less than or equal to 0.30mg/L"}
        
        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 0.30mg/L"}

    def FecalColiform(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value <= 20:
            return {"Class": "Class AA", "Color": "Blue", "Range": "Less than or equal to 20MPN/100mL"}
        
        if value <= 50:
            return {"Class": "Class A", "Color": "Green", "Range": "Greater than 20MPN/100mL and less than or equal to 50MPN/100mL"}
        
        if value <= 100:
            return {"Class": "Class B", "Color": "Yellow Green", "Range": "Greater than 50MPN/100mL and less than or equal to 100MPN/100mL"}
        
        if value <= 200:
            return {"Class": "Class C", "Color": "Yellow", "Range": "Greater than 100MPN/100mL and less than or equal to 200MPN/100mL"}
        
        if value <= 400:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than 200MPN/100mL and less than or equal to 400MPN/100mL"}
        

        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 400MPN/100mL"}
        
    def Nitrate(value):
        if value is None:
            return {"Class": "No Data", "Color": "Black", "Range": "No Data"}
        
        if value <= 7:
            return {"Class": "Class AA-C", "Color": "Green", "Range": "Less than or equal to 7mg/L"}
        
        if value <= 15:
            return {"Class": "Class D", "Color": "Orange", "Range": "Greater than 7mg/L and less than or equal to 15mg/L"}
        
        return {"Class": "Failed", "Color": "Red", "Range": "Greater than 15mg/L"}
    
    
    parameters = {
        "pH": pH,
        "Turbidity": Turbidity,
        "DO": DO,
        "TDS": TDS,
        "Temperature": Temperature,
        "ORP": ORP,
        "BOD": BOD,
        "Ammonia": Ammonia,
        "Nitrate": Nitrate,
        "Inorganic Phosphate": InorganicPhosphate,
        "Fecal Coliform": FecalColiform,
    }

    try:
        if sensor not in parameters:
            raise ValueError(f"Sensor '{sensor}' is not recognized.")

        return parameters[sensor](data)
    except ValueError as e:
        return {"Class": "Error", "Color": "Black", "Range": str(e)}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"Class": "Error", "Color": "Black", "Range": str(e)}
    