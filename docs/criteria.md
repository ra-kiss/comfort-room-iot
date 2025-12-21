# Decision Criteria and Standards

**Project:** ComfortRoom IoT Decision Support System  
**Requirement #3:** Define criteria supported by regulations and standards at the European or National level

---

## Criterion 1: Temperature

**Optimal Range:** 20-24°C for sedentary activities (classroom setting)

### Standards & Sources:

**EN 16798-1:2019** 

- Energy performance of buildings - Ventilation for buildings - Part 1: Indoor environmental input parameters for design and assessment of energy performance of buildings
- Category II (normal expectations): 20-24°C in winter, 23-26°C in summer
- Source: European Committee for Standardization (CEN)

**ISO 7730:2005** 

- Ergonomics of the thermal environment - Analytical determination and interpretation of thermal comfort
- Recommends 20-24°C for sedentary office work and education
- Predicted Mean Vote (PMV) should be between -0.5 and +0.5
- Source: International Organization for Standardization

**Luxembourg Labour Code (Code du travail)** 

- Article L.312-1
- Minimum temperature for sedentary work: 18°C
- Comfortable temperature range: 20-24°C
- Source: Government of Luxembourg

### Mapping Function:
- **Ideal:** 22°C (score = 100)
- **Acceptable:** 20-24°C (score = 80-100)
- **Tolerable:** 18-20°C or 24-26°C (score = 50-79)
- **Poor:** <18°C or >26°C (score = 0-49)

---

## Criterion 2: CO2 Levels

**Optimal Range:** <1000 ppm (parts per million)

### Standards & Sources:

**EN 16798-1:2019** 

- Indoor environmental input parameters
- Category I (high expectation): <800 ppm above outdoor levels (~1200 ppm absolute)
- Category II (medium expectation): <950 ppm above outdoor (~ 1350 ppm absolute)
- Category III (moderate expectation): <1350 ppm above outdoor (~1750 ppm absolute)
- Source: CEN - European Committee for Standardization

**ASHRAE Standard 62.1-2019** 

- Ventilation for Acceptable Indoor Air Quality
- Recommends <1000 ppm for indoor environments
- Above 1000 ppm indicates inadequate ventilation
- Source: American Society of Heating, Refrigerating and Air-Conditioning Engineers (widely adopted in EU)

**German Federal Environment Agency (Umweltbundesamt)** 

- Indoor Air Hygiene Commission
- <1000 ppm: Hygienic quality without concern
- 1000-1400 ppm: Hygienic quality of medium level
- \>1400 ppm: Unacceptable hygienic quality
- Source: Umweltbundesamt, 2008

### Mapping Function:

- **Ideal:** <800 ppm (score = 100)
- **Good:** 800-1000 ppm (score = 80-99)
- **Acceptable:** 1000-1400 ppm (score = 50-79)
- **Poor:** >1400 ppm (score = 0-49)

---

## Criterion 3: Humidity

**Optimal Range:** 40-60% relative humidity

### Standards & Sources:

**EN 16798-1:2019** 

- Indoor environmental input parameters
- Recommended range for thermal comfort: 30-70% RH
- Optimal range for health: 40-60% RH
- Source: CEN - European Committee for Standardization

**ASHRAE Standard 55-2020** 

- Thermal Environmental Conditions for Human Occupancy
- Recommends 30-60% RH for thermal comfort
- 40-60% optimal for preventing respiratory issues
- Source: ASHRAE

**WHO Housing and Health Guidelines (2018)**

- 40-60% RH reduces risk of respiratory infections
- Below 30% increases susceptibility to viruses
- Above 70% promotes mold growth
- Source: World Health Organization

### Mapping Function:

- **Ideal:** 45-55% (score = 100)
- **Good:** 40-60% (score = 80-99)
- **Acceptable:** 30-70% (score = 50-79)
- **Poor:** <30% or >70% (score = 0-49)

---

## Criterion 4: Sound Levels

**Optimal Range:** <35 dB for classrooms during teaching

### Standards & Sources:

**ISO 3382-2:2008** 

- Recommended background noise: <35 dB for teaching spaces
- Maximum: 40 dB for educational environments
- Source: International Organization for Standardization

**ANSI/ASA S12.60-2010**

- Classroom background noise: 35 dB maximum
- Core learning spaces: 35 dB limit
- Source: American National Standards Institute (referenced in EU guidelines)

**DIN 18041:2016-03** 

- Background noise level for classrooms: 30-35 dB
- Speech intelligibility requirements
- Source: Deutsches Institut für Normung

**Luxembourg Ministry of Education** 

- Recommended: <35 dB for optimal learning
- Maximum acceptable: 40 dB
- Source: Ministère de l'Éducation nationale, Luxembourg

### Mapping Function:
- **Ideal:** <30 dB (score = 100)
- **Good:** 30-35 dB (score = 80-99)
- **Acceptable:** 35-45 dB (score = 50-79)
- **Poor:** >45 dB (score = 0-49)

---

## Additional Criteria: Room Facilities

### Required/Desirable Facilities:
- **Capacity:** Must meet minimum student count requirements
- **Projector/Display:** Essential for modern teaching
- **Whiteboard/Blackboard:** Standard teaching equipment
- **Power Outlets:** Minimum 5 for student area, 2 for teacher area 
- **Accessibility:** Wheelchair accessible (EU Directive 2000/78/EC)

### Sources:
**EN 81-70:2003** - Accessibility to lifts for persons with disabilities

- Source: CEN - European Committee for Standardization

**EU Equal Treatment Directive 2000/78/EC**
- Requires reasonable accommodation for persons with disabilities

- Source: European Union

---

## Mapping Raw Values to Compliance Scores

All sensor readings are converted to a 0-100 compliance score using the following general approach:

```
If value is in IDEAL range:
    score = 100

If value is in GOOD/ACCEPTABLE range:
    score = 100 - (distance_from_ideal / max_acceptable_distance) * 50

If value is in POOR range:
    score = 50 - (distance_from_acceptable / max_poor_distance) * 50
    score = max(0, score)
```

This ensures that:

1. Ideal conditions receive maximum score
2. Deviations are penalized proportionally
3. Severely poor conditions receive near-zero scores
4. User preferences can adjust ideal values within acceptable ranges

---

## Summary Table

| Criterion | Ideal Value | Acceptable Range | Source Standard |
|-----------|-------------|------------------|-----------------|
| **Temperature** | 22°C | 20-24°C | EN 16798-1:2019, ISO 7730:2005 |
| **CO2** | <800 ppm | 800-1000 ppm | EN 16798-1:2019, ASHRAE 62.1 |
| **Humidity** | 45-55% | 40-60% | EN 16798-1:2019, WHO 2018 |
| **Sound** | <30 dB | 30-35 dB | ISO 3382-2:2008, DIN 18041 |

---

## References

1. **EN 16798-1:2019** - Energy performance of buildings - Ventilation for buildings. European Committee for Standardization (CEN). 2019.

2. **ISO 7730:2005** - Ergonomics of the thermal environment - Analytical determination and interpretation of thermal comfort. International Organization for Standardization. 2005.

3. **ISO 3382-2:2008** - Acoustics - Measurement of room acoustic parameters - Part 2: Reverberation time in ordinary rooms. International Organization for Standardization. 2008.

4. **ASHRAE Standard 62.1-2019** - Ventilation for Acceptable Indoor Air Quality. American Society of Heating, Refrigerating and Air-Conditioning Engineers. 2019.

5. **ASHRAE Standard 55-2020** - Thermal Environmental Conditions for Human Occupancy. ASHRAE. 2020.

6. **WHO Housing and Health Guidelines**. World Health Organization. 2018.

7. **DIN 18041:2016-03** - Acoustic quality in rooms. Deutsches Institut für Normung. 2016.

8. **Umweltbundesamt** - Health evaluation of carbon dioxide in indoor air. German Federal Environment Agency. 2008.

9. **Luxembourg Labour Code (Code du travail)** - Articles on workplace conditions. Government of Luxembourg.

10. **EU Equal Treatment Directive 2000/78/EC** - Establishing a general framework for equal treatment in employment. European Union. 2000.