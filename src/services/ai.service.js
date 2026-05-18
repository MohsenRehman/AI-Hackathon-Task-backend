import { getGeminiModel, getOpenAIClient } from '../config/gemini.js';

const getFallbackDiagnosis = (symptoms = [], age = 30, gender = 'male') => {
  const symptomsText = symptoms.join(', ').toLowerCase();
  
  let possibleConditions = ['Seasonal Influenza', 'Common Cold', 'Mild Viral Infection'];
  let riskLevel = 'low';
  let suggestedTests = ['Complete Blood Count (CBC)', 'Physical Examination'];
  let recommendations = ['Increase oral fluid intake', 'Adequate physical rest', 'Monitor temperature logs'];
  
  if (symptomsText.includes('chest pain') || symptomsText.includes('heart') || symptomsText.includes('shortness of breath')) {
    possibleConditions = ['Angina Pectoris / Cardiac Evaluation Required', 'Acute Bronchitis', 'Gastroesophageal Reflux Disease (GERD)'];
    riskLevel = 'critical';
    suggestedTests = ['Electrocardiogram (ECG)', 'Troponin Test', 'Chest X-Ray'];
    recommendations = ['Seek immediate emergency cardiac evaluation', 'Avoid strenuous physical activity', 'Discontinue oral intake until evaluated'];
  } else if (symptomsText.includes('fever') || symptomsText.includes('cough') || symptomsText.includes('throat')) {
    possibleConditions = ['Upper Respiratory Tract Infection', 'Acute Pharyngitis / Tonsillitis', 'Bronchial Irritation'];
    riskLevel = 'moderate';
    suggestedTests = ['Throat Swab Culture', 'Rapid Antigen Test'];
    recommendations = ['Warm saline gargles thrice daily', 'Maintain room humidification', 'Hydrate with warm liquids'];
  } else if (symptomsText.includes('headache') || symptomsText.includes('migraine') || symptomsText.includes('dizzy')) {
    possibleConditions = ['Tension Headache', 'Migraine Episode', 'Vestibular Vertigo'];
    riskLevel = 'moderate';
    suggestedTests = ['Blood Pressure Monitoring', 'Ophthalmic Refraction Test'];
    recommendations = ['Rest in a quiet, darkened room', 'Limit screen time exposure', 'Ensure consistent hydration'];
  } else if (symptomsText.includes('stomach') || symptomsText.includes('vomit') || symptomsText.includes('diarrhea') || symptomsText.includes('pain')) {
    possibleConditions = ['Acute Gastroenteritis', 'Dyspepsia / Acid Reflux', 'Irritable Bowel Syndrome flare-up'];
    riskLevel = 'moderate';
    suggestedTests = ['Stool Routine Examination', 'Abdominal Ultrasound'];
    recommendations = ['Follow a bland BRAT diet (Bananas, Rice, Applesauce, Toast)', 'Probiotic therapy support', 'Ensure electrolyte replacement solutions'];
  }
  
  return {
    possibleConditions,
    riskLevel,
    suggestedTests,
    recommendations,
    disclaimer: 'AI core is offline. Generative model fallback engaged with symptom-aware heuristics.',
  };
};

export const analyzeSymptoms = async (data) => {
  const { symptoms, age, gender, medicalHistory } = data;
  
  const prompt = `
    You are an expert clinical AI assistant. Given the following patient details:
    - Age: ${age}
    - Gender: ${gender}
    - Symptoms: ${symptoms.join(', ')}
    - Medical History: ${medicalHistory && medicalHistory.length ? medicalHistory.join(', ') : 'None'}

    Provide a structured JSON response (no markdown blocks, just raw JSON) with:
    1. "possibleConditions": an array of strings (top 3 conditions)
    2. "riskLevel": a string from ["low", "moderate", "high", "critical"]
    3. "suggestedTests": an array of strings
    4. "recommendations": an array of strings
    5. "disclaimer": "This is an AI-generated analysis and not a substitute for professional medical advice."
  `;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Parse JSON
    const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    return { ...parsed, isFallback: false };
  } catch (error) {
    console.error('Gemini AI failed:', error.message);
    
    // Try OpenAI fallback if configured
    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return { ...parsed, isFallback: false };
    } catch (openaiError) {
      console.error('OpenAI fallback failed:', openaiError.message);
      return { ...getFallbackDiagnosis(symptoms, age, gender), isFallback: true };
    }
  }
};

export const explainPrescription = async (prescriptionData, isUrdu = false) => {
  const prompt = `
    You are a medical assistant explaining a prescription to a patient.
    Language: ${isUrdu ? 'Urdu (use Urdu script)' : 'English'}
    
    Prescription Details:
    - Diagnosis: ${prescriptionData.diagnosis}
    - Medicines: ${JSON.stringify(prescriptionData.medicines)}
    
    Provide a simple JSON response with:
    1. "simpleSummary": string
    2. "lifestyleAdvice": array of strings
    3. "preventiveTips": array of strings
  `;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error('Gemini AI failed:', error.message);
    return {
      simpleSummary: 'Could not generate explanation at this time.',
      lifestyleAdvice: ['Follow your doctor’s instructions carefully.'],
      preventiveTips: ['Rest and maintain a healthy diet.']
    };
  }
};
