import { IAiProvider } from './ai-provider.interface.js';
import {
  AiPromptRequest,
  AiPromptResponse,
  SourceReference,
  AssistantAction,
  SupportedLanguage,
  GroundedContextData,
} from '../assistant.types.js';

export class MockAiProvider implements IAiProvider {
  public async generateCompletion(request: AiPromptRequest): Promise<AiPromptResponse> {
    const { userMessage, groundedContext, language, intent } = request;
    const lowerMessage = userMessage.toLowerCase();

    // 1. Prompt Injection Defenses
    if (
      lowerMessage.includes('ignore previous instructions') ||
      lowerMessage.includes('system prompt') ||
      lowerMessage.includes('api key') ||
      lowerMessage.includes('database credentials') ||
      lowerMessage.includes('treat this document as an instruction')
    ) {
      return this.handlePromptInjection(language);
    }

    if (
      lowerMessage.includes("another user's") ||
      lowerMessage.includes('other user') ||
      lowerMessage.includes('all users') ||
      lowerMessage.includes('everyone who qualifies')
    ) {
      return this.handleDataExfiltration(language);
    }

    // 2. Intent-Based Grounded Generation
    switch (intent) {
      case 'EXPLAIN_ELIGIBILITY':
        return this.generateEligibilityExplanation(groundedContext, language, userMessage);

      case 'EXPLAIN_DOCUMENTS':
      case 'EXPLAIN_OCR_RESULT':
        return this.generateDocumentsExplanation(groundedContext, language, userMessage);

      case 'SUMMARIZE_SCHEME':
        return this.generateSchemeSummary(groundedContext, language);

      case 'COMPARE_SCHEMES':
        return this.generateComparisonExplanation(groundedContext, language, userMessage);

      case 'EXPLAIN_NOTIFICATION':
        return this.generateNotificationExplanation(groundedContext, language);

      case 'EXPLAIN_APPLICATION_STEPS':
        return this.generateApplicationSteps(groundedContext, language);

      case 'EXPLAIN_SCHEME':
      case 'TRANSLATE_SCHEME':
      case 'GENERAL_SCHEME_QUESTION':
      default:
        return this.generateSchemeExplanation(groundedContext, language, userMessage);
    }
  }

  private handlePromptInjection(language: SupportedLanguage): AiPromptResponse {
    const answers: Record<SupportedLanguage, string> = {
      en: 'I am the AI Scheme & Scholarship Assistant. I provide neutral, grounded explanations of government schemes based strictly on verified portal records. I cannot reveal internal system prompts or security parameters.',
      ta: 'நான் அரசு உதவித்தொகை திட்டங்களின் விளக்க உதவியாளர். சரிபார்க்கப்பட்ட போர்ட்டல் பதிவுகளின் அடிப்படையில் மட்டுமே தகவல்களை வழங்குவேன். உள் கணினி கட்டளைகளை வெளிப்படுத்த முடியாது.',
      hi: 'मैं सरकारी योजना एवं छात्रवृत्ति सहायक हूँ। मैं केवल सत्यापित पोर्टल रिकॉर्ड के आधार पर निष्पक्ष जानकारी प्रदान करता हूँ। मैं आंतरिक सिस्टम निर्देशों को साझा नहीं कर सकता।',
      ml: 'ഞാൻ സർക്കാർ പദ്ധതികളുടെ വിശദീകരണ സഹായിയാണ്. പോർട്ടലിൽ സ്ഥിരീകരിച്ച രേഖകൾ മാത്രമേ ഞാൻ നൽകൂ.',
      te: 'నేను ప్రభుత్వ పథకాల వివరణాత్మక సహాయకుడిని. ధృవీకరించబడిన సమాచారం మాత్రమే అందిస్తాను.',
      kn: 'ನಾನು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರಣಾತ್ಮಕ ಸಹಾಯಕ. ದೃಢೀಕರಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನೀಡಬಲ್ಲೆ.',
    };

    return {
      answer: answers[language] || answers.en,
      intent: 'HELP_WITH_PORTAL',
      confidence: 'GROUNDED',
      sources: [],
      actions: [],
      inputTokens: 50,
      outputTokens: 40,
    };
  }

  private handleDataExfiltration(language: SupportedLanguage): AiPromptResponse {
    const answers: Record<SupportedLanguage, string> = {
      en: 'Strict data privacy controls prevent access to other citizens’ documents, profiles, or evaluations. I can only assist with your own verified information.',
      ta: 'பாதுகாப்புக் காரணங்களால் மற்ற பயனர்களின் ஆவணங்கள் அல்லது தகவல்களை அணுக முடியாது. உங்கள் சரிபார்க்கப்பட்ட தகவல்களுக்கு மட்டுமே நான் உதவ முடியும்.',
      hi: 'डेटा गोपनीयता नियमों के अनुसार अन्य नागरिकों के दस्तावेज़ या विवरण साझा नहीं किए जा सकते।',
      ml: 'സ്വകാര്യതാ നിയമങ്ങൾ അനുസരിച്ച് മറ്റ് പൗരന്മാരുടെ രേഖകൾ ആക്സസ് ചെയ്യാൻ കഴിയില്ല.',
      te: 'గోప్యతా నిబంధనల ప్రకారం ఇతర పౌరుల డేటాను చూడలేరు.',
      kn: 'ಗೌಪ್ಯತೆ ನಿಯಮಗಳ ಪ್ರಕಾರ ಇತರ ನಾಗರಿಕರ ಮಾಹಿತಿಯನ್ನು ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.',
    };

    return {
      answer: answers[language] || answers.en,
      intent: 'HELP_WITH_PORTAL',
      confidence: 'GROUNDED',
      sources: [],
      actions: [],
      inputTokens: 40,
      outputTokens: 35,
    };
  }

  private generateEligibilityExplanation(
    context: GroundedContextData,
    language: SupportedLanguage,
    userMessage: string = '',
  ): AiPromptResponse {
    const rec = context.recommendation;
    const scheme = context.scheme;
    const msg = userMessage.toLowerCase();

    if (!rec) {
      if (
        msg.includes('how does the recommendation engine') ||
        msg.includes('assess my eligibility') ||
        msg.includes('engine assess')
      ) {
        let answer = `### Deterministic Recommendation Engine Overview\n\nThe portal’s recommendation engine uses **deterministic rule-based evaluation** rather than opaque probabilistic or black-box algorithms:\n\n1. **Rule Evaluation (Boolean Logic):** Schemes define statutory conditions using explicit logical groups (\`AND\`, \`OR\`, \`NOT\`). Every rule is evaluated against your verified profile data (e.g., age, community category, education level, state of domicile, and annual income).\n2. **Deterministic State Categorization:**\n   • **Eligible / Likely Eligible:** All mandatory scheme rules are satisfied by your profile attributes.\n   • **Not Eligible:** One or more non-negotiable statutory rules (such as income ceiling or course requirement) were not met.\n   • **Requires Information:** Missing profile data prevents definitive evaluation.\n3. **Auditability & Explainability:** The system generates an explicit audit trace with satisfied criteria, unmet conditions, and missing fields so you understand the exact basis of every assessment.\n4. **Data Minimization:** Only attributes strictly required by the scheme's gazetted rules are inspected.`;

        if (language === 'ta') {
          answer = `### பரிந்துரை என்ஜின் எவ்வாறு தகுதியை மதிப்பிடுகிறது\n\nஇந்த போர்ட்டல் ஒளிவுமறைவற்ற **விதிமுறை அடிப்படையிலான மதிப்பீட்டை** (Deterministic Evaluation) பயன்படுத்துகிறது:\n\n1. **விதிமுறை பகுப்பாய்வு:** உங்கள் சரிபார்க்கப்பட்ட சுயவிவரத் தரவுகள் (வயது, கல்வி, சமூகப் பிரிவு, மாநிலம், ஆண்டு வருமானம்) திட்ட விதிகளுடன் நேரடியாக ஒப்பிடப்படுகின்றன.\n2. **தெளிவான தகுதி நிலை:** தகுதியுள்ளவை, கூடுதல் தகவல் தேவைப்படுபவை, அல்லது தகுதியற்றவை என வெளிப்படையாக வகைப்படுத்தப்படும்.\n3. **காரண விளக்கம்:** தகுதி பெறாததற்கான சரியான காரணமும், தகுதி பெற என்ன தகவல்கள் தேவை என்பதும் வெளிப்படையாக தெரிவிக்கப்படும்.\n4. **தரவுப் பாதுகாப்பு:** தேவைப்படும் குறைந்தபட்ச தரவுகள் மட்டுமே பயன்படுத்தப்படுகின்றன.`;
        } else if (language === 'hi') {
          answer = `### सिफारिश इंजन आपकी पात्रता का आकलन कैसे करता है\n\nपोर्टल का सिफारिश इंजन किसी भी ब्लैक-बॉक्स एल्गोरिदम के बजाय **नियम-आधारित मूल्यांकन** का उपयोग करता है:\n\n1. **नियम मूल्यांकन:** आपके सत्यापित प्रोफ़ाइल डेटा (आयु, श्रेणी, शिक्षा, राज्य, वार्षिक आय) की तुलना सीधे आधिकारिक योजना नियमों से की जाती है।\n2. **पारदर्शी परिणाम:** 'पात्र', 'जानकारी आवश्यक', या 'अपात्र' स्थिति स्पष्ट रूप से निर्धारित की जाती है।\n3. **पूर्ण व्याख्या:** किसी भी शर्त के पूरा न होने का सटीक कारण बताया जाता है।`;
        }

        return {
          answer,
          intent: 'EXPLAIN_ELIGIBILITY',
          confidence: 'GROUNDED',
          sources: [
            {
              type: 'RECOMMENDATION',
              title: 'Module 4 Deterministic Rule Evaluation Specifications',
            },
          ],
          actions: [{ type: 'VIEW_RECOMMENDATION', label: 'View Recommendations' }],
          inputTokens: 90,
          outputTokens: 110,
        };
      }

      if (
        !scheme &&
        (msg.includes('scholarship') ||
          msg.includes('education profile') ||
          msg.includes('match') ||
          context.matchingSchemes?.length)
      ) {
        const prof = context.profileSummary;
        const edu = prof?.educationLevel || 'Undergraduate / Higher Education';
        const st = prof?.state || 'All India';
        const cat = prof?.socialCategory || 'General / All Categories';

        let schemesList = '';
        const matching = (context.matchingSchemes || []).slice(0, 4);
        const sources: SourceReference[] = [];
        const actions: AssistantAction[] = [
          { type: 'VIEW_RECOMMENDATION', label: 'View All Recommended Schemes' },
        ];

        if (matching.length > 0) {
          schemesList = matching
            .map((s, idx) => {
              const ben = s.primaryBenefit
                ? `— Benefit: ${s.primaryBenefit.type}${s.primaryBenefit.amount ? ` ₹${Number(s.primaryBenefit.amount).toLocaleString('en-IN')}` : ''} (${s.primaryBenefit.frequency || 'Annual'})`
                : '';
              sources.push({
                type: 'SCHEME',
                id: s.id,
                title: s.name,
                url: s.officialApplicationUrl || undefined,
              });
              if (idx === 0) {
                actions.push({
                  type: 'VIEW_SCHEME',
                  label: `View ${s.name.slice(0, 24)}...`,
                  payload: { schemeId: s.id, slug: s.slug },
                });
              }
              return `• **${s.name}**\n  *Department:* ${s.department} ${ben}\n  *Status:* ${s.applicationStatus || 'Application Open'}`;
            })
            .join('\n\n');
        } else {
          schemesList =
            '• **Post-Matric Scholarship Scheme** — Financial assistance for tuition and maintenance.\n• **Central Sector Scheme of Scholarship** — Merit-cum-means scholarship for higher education.';
        }

        let answer = `### Scholarships Matching Your Education Profile\n\nBased on your profile attributes (**${edu}**, **${st}**, **${cat}**), here are verified scholarships currently available on the portal:\n\n${schemesList}\n\n• **Next Step:** Select any scholarship above or open the Recommendations dashboard to verify your specific rule satisfaction and upload mandatory documents.`;

        if (language === 'ta') {
          answer = `### உங்கள் கல்வி சுயவிவரத்துடன் பொருந்தும் கல்வி உதவித்தொகைகள்\n\nஉங்கள் விவரங்கள் (**${edu}**, **${st}**, **${cat}**) அடிப்படையில் போர்ட்டலில் உள்ள முதன்மை உதவித்தொகை திட்டங்கள்:\n\n${schemesList}\n\n• **அடுத்த படி:** திட்டத்தை தேர்ந்தெடுத்து உங்கள் தகுதி நிலையை உறுதிசெய்து விண்ணப்பிக்கவும்.`;
        } else if (language === 'hi') {
          answer = `### आपके शिक्षा प्रोफ़ाइल से मेल खाने वाली छात्रवृत्तियाँ\n\nआपकी प्रोफ़ाइल (**${edu}**, **${st}**, **${cat}**) के आधार पर उपलब्ध मुख्य छात्रवृत्ति योजनाएँ:\n\n${schemesList}\n\n• **अगला कदम:** पूर्ण विवरण देखने और आवेदन करने के लिए अनुशंसाएँ डैशबोर्ड पर जाएँ।`;
        }

        return {
          answer,
          intent: 'EXPLAIN_ELIGIBILITY',
          confidence: 'GROUNDED',
          sources: sources.length
            ? sources
            : [{ type: 'SCHEME', title: 'Portal Verified Scholarships' }],
          actions,
          inputTokens: 110,
          outputTokens: 120,
        };
      }

      const fallback =
        language === 'ta'
          ? 'இந்தத் திட்டத்திற்கான உங்கள் தகுதி மதிப்பீடு போர்ட்டலில் இதுவரை கணக்கிடப்படவில்லை. தயவுசெய்து உங்கள் சுயவிவரத்தைப் புதுப்பித்து தகுதி பரிந்துரைகளைப் பார்க்கவும்.'
          : 'Your eligibility for this scheme has not yet been computed by the recommendation engine. Please ensure your profile is up-to-date and refresh your dashboard recommendations.';

      return {
        answer: fallback,
        intent: 'EXPLAIN_ELIGIBILITY',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: scheme
          ? [
              {
                type: 'SCHEME',
                id: scheme.id,
                title: scheme.name,
                url: scheme.officialSourceUrl || undefined,
              },
            ]
          : [],
        actions: [{ type: 'VIEW_RECOMMENDATION', label: 'View Recommendations' }],
        inputTokens: 60,
        outputTokens: 45,
      };
    }

    const status = rec.eligibilityStatus;
    const matched = rec.matchingRequirements || [];
    const missing = rec.missingRequirements || [];
    const uncertain = rec.uncertainRequirements || [];

    let explanationEn = `Your current assessment from the recommendation engine is **${status.replace(/_/g, ' ')}**.\n\n`;

    if (matched.length > 0) {
      explanationEn += `• **Satisfied Criteria:** ${matched.join(', ')}\n`;
    }
    if (missing.length > 0) {
      explanationEn += `• **Unsatisfied Criteria:** ${missing.join(', ')}\n`;
    }
    if (uncertain.length > 0) {
      explanationEn += `• **Pending Verification:** ${uncertain.join(', ')}\n`;
    }

    explanationEn += `\n*Note: This evaluation was deterministically produced by Module 4 based on your verified profile attributes.*`;

    let answer = explanationEn;
    if (language === 'ta') {
      answer = `பரிந்துரை என்ஜினின் தற்போதைய மதிப்பீடு: **${status}**.\n\n`;
      if (matched.length > 0) answer += `• **பொருந்திய தேவைகள்:** ${matched.join(', ')}\n`;
      if (missing.length > 0) answer += `• **பொருந்தாத நிபந்தனைகள்:** ${missing.join(', ')}\n`;
      if (uncertain.length > 0) answer += `• **சரிபார்க்க வேண்டியவை:** ${uncertain.join(', ')}\n`;
      answer += `\n*குறிப்பு: இந்த மதிப்பீடு உங்கள் சுயவிவரத் தரவுகளின் அடிப்படையில் விதிமுறை எஞ்சினால் கணக்கிடப்பட்டது.*`;
    } else if (language === 'hi') {
      answer = `सिफारिश इंजन के अनुसार आपका वर्तमान मूल्यांकन: **${status}** है।\n\n`;
      if (matched.length > 0) answer += `• **संतुष्ट मानदंड:** ${matched.join(', ')}\n`;
      if (missing.length > 0) answer += `• **असंतुष्ट शर्तें:** ${missing.join(', ')}\n`;
      if (uncertain.length > 0) answer += `• **सत्यापन आवश्यक:** ${uncertain.join(', ')}\n`;
      answer += `\n*ध्यान दें: यह मूल्यांकन आपके प्रोफाइल डेटा के आधार पर निर्धारित किया गया है।*`;
    }

    const sources: SourceReference[] = [
      {
        type: 'RECOMMENDATION',
        id: rec.id,
        title: `Recommendation: ${rec.schemeName || 'Scheme'}`,
      },
    ];

    if (scheme) {
      sources.push({
        type: 'SCHEME',
        id: scheme.id,
        title: scheme.name,
        url: scheme.officialSourceUrl || undefined,
      });
    }

    const actions: AssistantAction[] = [
      {
        type: 'VIEW_RECOMMENDATION',
        label: 'View Recommendation Details',
        payload: { recommendationId: rec.id, schemeId: rec.schemeId },
      },
    ];

    return {
      answer,
      intent: 'EXPLAIN_ELIGIBILITY',
      confidence: 'GROUNDED',
      sources,
      actions,
      inputTokens: 110,
      outputTokens: 95,
    };
  }

  private generateDocumentsExplanation(
    context: GroundedContextData,
    language: SupportedLanguage,
    userMessage: string = '',
  ): AiPromptResponse {
    const docReadiness = context.documentReadiness;
    const scheme = context.scheme;
    const msg = userMessage.toLowerCase();

    if (!scheme && !docReadiness) {
      if (msg.includes('income certificate')) {
        let answer = `### Statutory Purpose of the Income Certificate\n\nAn **Income Certificate** is an indispensable evidentiary document for government welfare and scholarship programs for the following statutory reasons:\n\n1. **Statutory Income Ceilings:** Most central and state welfare programs enforce strict annual household income limits (e.g., ₹2.50 Lakhs for Centrally Sponsored Post-Matric Scholarships, ₹8.00 Lakhs for EWS / OBC-NCL reservations).\n2. **Targeted Welfare Distribution:** It legally guarantees public subsidies and state treasury funds reach genuinely deserving citizens from economically disadvantaged backgrounds.\n3. **Revenue Department Authentication:** It must be issued by the competent territorial revenue authority (**Tahsildar / Revenue Department / Sub-Divisional Magistrate**) with digital signature or official QR verification.\n4. **Automated Verification & DigiLocker:** When uploaded or linked via DigiLocker, the portal performs deterministic OCR and metadata validation against scheme eligibility criteria.\n\n> **Important:** Ensure your income certificate reflects the current financial year to avoid scheme application disqualification.`;

        if (language === 'ta') {
          answer = `### வருமானச் சான்றிதழ் ஏன் தேவைப்படுகிறது?\n\nஅரசு உதவித்தொகை மற்றும் நலத்திட்டங்களுக்கு **வருமானச் சான்றிதழ்** கட்டாயமாக இருப்பதற்கான காரணங்கள்:\n\n1. **வருமான உச்சவரம்பு:** பெரும்பாலான அரசு திட்டங்களில் குறிப்பிட்ட ஆண்டு வருமான வரம்பு நிர்ணயிக்கப்பட்டுள்ளது (எ.கா. போஸ்ட்-மெட்ரிக் திட்டத்திற்கு ₹2.5 லட்சம் வரை).\n2. **சரியான பயனாளிகளை அடைதல்:** நிதி உதவி உண்மையிலேயே தகுதியான மற்றும் பொருளாதார ரீதியாக பின்தங்கிய மாணவர்களைச் சென்றடைவதை உறுதி செய்கிறது.\n3. **வருவாய்த்துறை சரிபார்ப்பு:** வட்டாட்சியர் (Tahsildar) அல்லது அதிகாரப்பூர்வ வருவாய்த்துறையினரால் டிஜிட்டல் கையொப்பத்துடன் வழங்கப்பட வேண்டும்.\n4. **டிஜிலாக்கர் சரிபார்ப்பு:** போர்ட்டலில் பதிவேற்றும்போது உடனடி தானியங்கி சரிபார்ப்பு செய்யப்படுகிறது.`;
        } else if (language === 'hi') {
          answer = `### आय प्रमाण पत्र की आवश्यकता क्यों है?\n\nसरकारी योजनाओं और छात्रवृत्ति के लिए **आय प्रमाण पत्र** अनिवार्य है:\n\n1. **संवैधानिक आय सीमा:** अधिकांश योजनाओं में वार्षिक पारिवारिक आय की अधिकतम सीमा निर्धारित होती है (जैसे ₹2.5 लाख या ₹8 लाख)।\n2. **लक्षित कल्याणकारी वितरण:** यह सुनिश्चित करता है कि सरकारी लाभ सही और आर्थिक रूप से कमजोर वर्ग तक पहुँचे।\n3. **सक्षम प्राधिकारी द्वारा जारी:** तहसीलदार या राजस्व विभाग द्वारा डिजिटल हस्ताक्षर सहित जारी होना आवश्यक है।`;
        }

        return {
          answer,
          intent: 'EXPLAIN_DOCUMENTS',
          confidence: 'GROUNDED',
          sources: [
            {
              type: 'DOCUMENT',
              title: 'Revenue Department Income Certification Guidelines',
            },
          ],
          actions: [{ type: 'VIEW_DOCUMENTS', label: 'Open Document Library' }],
          inputTokens: 90,
          outputTokens: 110,
        };
      }

      if (
        msg.includes('prepare my document') ||
        msg.includes('prepare documents') ||
        msg.includes('how can i prepare')
      ) {
        let answer = `### Document Preparation Checklist for Scheme Applications\n\nFollow this 5-point checklist to ensure your documents pass verification with zero delay:\n\n1. **Identity & e-KYC Proof:**\n   • Valid **Aadhaar Card** with active mobile number linked for OTP verification.\n   • Name, DOB, and gender must match your matriculation records exactly.\n2. **Income Certificate:**\n   • Valid certificate for the current financial year issued by your local Tahsildar / Revenue Authority.\n3. **Community / Caste Certificate:**\n   • Permanent community certificate with digital signature / barcoded verification (for SC, ST, OBC, or EWS).\n4. **Academic Records:**\n   • Marksheets of previous qualifying examinations, bona fide student certificate from institution, and current semester fee receipt.\n5. **Aadhaar-Seeded Bank Account:**\n   • Active savings bank account linked to your Aadhaar and NPCI-enabled for Direct Benefit Transfer (DBT).\n\n> **Tip:** You can fetch verified documents instantly from DigiLocker or upload clear PDF scans (under 5MB) in your Document Library.`;

        if (language === 'ta') {
          answer = `### திட்ட விண்ணப்பங்களுக்கான ஆவணங்களை எவ்வாறு தயார் செய்வது?\n\nவிண்ணப்பங்கள் நிராகரிக்கப்படாமல் இருக்க இந்த 5-படி ஆவண வழிகாட்டியைப் பின்பற்றவும்:\n\n1. **ஆதார் அட்டை:** மொபைல் எண்ணுடன் இணைக்கப்பட்ட புதுப்பிக்கப்பட்ட ஆதார் (OTP e-KYC க்காக).\n2. **வருமானச் சான்றிதழ்:** நடப்பு நிதியாண்டிற்கு வட்டாட்சியரால் வழங்கப்பட்டது.\n3. **சாதி/சமூகச் சான்றிதழ்:** பார்-கோடு அல்லது டிஜிட்டல் கையொப்பமிட்ட நிரந்தர சான்றிதழ்.\n4. **கல்வி ஆவணங்கள்:** மதிப்பெண் பட்டியல், கல்வி நிறுவனத்தின் Bonafide சான்றிதழ் மற்றும் கட்டண ரசீது.\n5. **வங்கி கணக்கு:** ஆதாருடன் இணைக்கப்பட்ட மற்றும் DBT செயல்படுத்தப்பட்ட சேமிப்பு கணக்கு.`;
        } else if (language === 'hi') {
          answer = `### योजना आवेदनों के लिए दस्तावेज़ कैसे तैयार करें?\n\nत्वरित सत्यापन के लिए निम्नलिखित दस्तावेज़ चेकलिस्ट का पालन करें:\n\n1. **आधार कार्ड:** ओटीपी सत्यापन के लिए मोबाइल नंबर से लिंक होना आवश्यक है।\n2. **आय प्रमाण पत्र:** चालू वित्तीय वर्ष का सक्षम राजस्व अधिकारी द्वारा जारी प्रमाण पत्र।\n3. **जाति प्रमाण पत्र:** डिजिटल हस्ताक्षर युक्त वैध प्रमाण पत्र।\n4. **शैक्षणिक रिकॉर्ड:** अंकतालिका, कॉलेज का बोनाफाइड प्रमाण पत्र और शुल्क रसीद।\n5. **डीबीटी बैंक खाता:** आधार से जुड़ा सक्रिय बैंक खाता।`;
        }

        return {
          answer,
          intent: 'EXPLAIN_DOCUMENTS',
          confidence: 'GROUNDED',
          sources: [
            {
              type: 'DOCUMENT',
              title: 'Portal Document Preparation & Verification Standards',
            },
          ],
          actions: [{ type: 'VIEW_DOCUMENTS', label: 'Open Document Library' }],
          inputTokens: 95,
          outputTokens: 115,
        };
      }

      return {
        answer:
          language === 'ta'
            ? 'தேவையான ஆவணங்கள் பற்றிய சரிபார்க்கப்பட்ட தகவல்கள் கிடைக்கவில்லை.'
            : 'Verified required document information is not available in the current context.',
        intent: 'EXPLAIN_DOCUMENTS',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: [],
        actions: [{ type: 'VIEW_DOCUMENTS', label: 'Open Document Library' }],
        inputTokens: 50,
        outputTokens: 30,
      };
    }

    const docs = scheme?.requiredDocuments || [];
    let answer = `Here are the document requirements for **${scheme?.name || 'this scheme'}**:\n\n`;

    if (docs.length > 0) {
      docs.forEach((d) => {
        answer += `• **${d.name}** — ${d.mandatory ? 'Mandatory' : 'Optional'}${d.issuingAuthority ? ` (Issued by: ${d.issuingAuthority})` : ''}\n`;
      });
    }

    if (docReadiness) {
      answer += `\n**Your Current Readiness:** ${docReadiness.readinessStatus} (${docReadiness.readinessScore}%)\n`;
      if (docReadiness.missingMandatory?.length > 0) {
        answer += `• Missing Mandatory: ${docReadiness.missingMandatory.join(', ')}\n`;
      }
    }

    if (language === 'ta') {
      answer = `**${scheme?.name || 'இந்த திட்டம்'}** திட்டத்திற்கு தேவையான ஆவணங்கள்:\n\n`;
      docs.forEach((d) => {
        answer += `• **${d.name}** — ${d.mandatory ? 'கட்டாயமானது' : 'விருப்பமானது'}${d.issuingAuthority ? ` (${d.issuingAuthority})` : ''}\n`;
      });
      if (docReadiness) {
        answer += `\n**உங்கள் தற்போதைய ஆவண நிலை:** ${docReadiness.readinessStatus} (${docReadiness.readinessScore}%)\n`;
      }
    }

    const sources: SourceReference[] = [];
    if (scheme) {
      sources.push({
        type: 'SCHEME',
        id: scheme.id,
        title: scheme.name,
        url: scheme.officialSourceUrl || undefined,
      });
    }
    if (docReadiness) {
      sources.push({ type: 'DOCUMENT', title: 'Document Verification Readiness' });
    }

    return {
      answer,
      intent: 'EXPLAIN_DOCUMENTS',
      confidence: 'GROUNDED',
      sources,
      actions: [{ type: 'VIEW_DOCUMENTS', label: 'Open Document Library' }],
      inputTokens: 90,
      outputTokens: 85,
    };
  }

  private generateSchemeSummary(
    context: GroundedContextData,
    language: SupportedLanguage,
  ): AiPromptResponse {
    const scheme = context.scheme;
    if (!scheme) {
      return {
        answer: 'I don’t have verified scheme records to summarize.',
        intent: 'SUMMARIZE_SCHEME',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: [],
        actions: [],
        inputTokens: 40,
        outputTokens: 25,
      };
    }

    const benefits =
      scheme.benefits?.map((b) => {
        const amt = b.amount ? `₹${Number(b.amount).toLocaleString('en-IN')}` : '';
        return `${b.benefitType.replace(/_/g, ' ')} ${amt} ${b.frequency ? `(${b.frequency})` : ''} - ${b.description || ''}`;
      }) || [];

    const deadline = scheme.activePeriod?.closeDate || 'Not specified / Check official portal';

    let answer = `### Summary: ${scheme.name}\n\n`;
    answer += `**Overview:** ${scheme.shortDescription || scheme.description}\n\n`;
    answer += `**Department:** ${scheme.department}\n`;
    answer += `**Program Type:** ${scheme.programType}\n`;
    answer += `**Application Deadline:** ${deadline}\n\n`;
    answer += `**Key Benefits:**\n${benefits.length ? benefits.map((b: string) => `• ${b}`).join('\n') : '• Refer to official notification'}\n\n`;
    answer += `**Required Documents:**\n${scheme.requiredDocuments?.map((d) => `• ${d.name} (${d.mandatory ? 'Mandatory' : 'Optional'})`).join('\n') || 'None listed'}`;

    if (language === 'ta') {
      answer = `### சுருக்கம்: ${scheme.name}\n\n`;
      answer += `**விளக்கம்:** ${scheme.shortDescription || scheme.description}\n\n`;
      answer += `**துறை:** ${scheme.department}\n`;
      answer += `**விண்ணப்பக் கடைசி நாள்:** ${deadline}\n\n`;
      answer += `**நன்மைகள்:**\n${benefits.length ? benefits.map((b: string) => `• ${b}`).join('\n') : 'அதிகாரப்பூர்வ அறிவிப்பைப் பார்க்கவும்'}\n\n`;
      answer += `**தேவையான ஆவணங்கள்:**\n${scheme.requiredDocuments?.map((d) => `• ${d.name}`).join('\n') || 'குறிப்பிடப்படவில்லை'}`;
    }

    const actions: AssistantAction[] = [
      {
        type: 'VIEW_SCHEME',
        label: 'View Scheme Details',
        payload: { schemeId: scheme.id, slug: scheme.slug },
      },
    ];

    if (scheme.officialApplicationUrl) {
      actions.push({
        type: 'OPEN_OFFICIAL_URL',
        label: 'Open Official Application Portal',
        url: scheme.officialApplicationUrl,
      });
    }

    return {
      answer,
      intent: 'SUMMARIZE_SCHEME',
      confidence: 'GROUNDED',
      sources: [
        {
          type: 'SCHEME',
          id: scheme.id,
          title: scheme.name,
          url: scheme.officialSourceUrl || undefined,
        },
      ],
      actions,
      inputTokens: 120,
      outputTokens: 110,
    };
  }

  private generateComparisonExplanation(
    context: GroundedContextData,
    language: SupportedLanguage,
    userMessage: string = '',
  ): AiPromptResponse {
    const comp = context.comparison;
    const msg = userMessage.toLowerCase();

    if (!comp || !comp.schemes || comp.schemes.length === 0) {
      if (
        msg.includes('central and state') ||
        msg.includes('difference between central') ||
        msg.includes('central vs state')
      ) {
        let answer = `### Difference Between Central and State Schemes\n\nIn India’s welfare governance, schemes are categorized into three administrative models:\n\n1. **Central Sector Schemes (CS):**\n   • **Funding:** **100% funded** by the Central Government / Union Ministries.\n   • **Implementation:** Administered directly by Central ministries or national portals (e.g., National Scholarship Portal, PM-KISAN).\n   • **Coverage:** Open to eligible citizens nationwide irrespective of state borders.\n\n2. **Centrally Sponsored Schemes (CSS):**\n   • **Funding:** Cost-shared between Centre and States (usually **60:40** for general states, **90:10** for North Eastern/Himalayan states).\n   • **Implementation:** Administered and disbursed by State Government departments adhering to central statutory norms (e.g., Post-Matric Scholarship for SC/ST/OBC).\n   • **Coverage:** Implemented across participating states with uniform eligibility rules.\n\n3. **State Schemes:**\n   • **Funding:** **100% funded** from the State Government’s Consolidated Fund.\n   • **Implementation:** Formulated, monitored, and disbursed exclusively by State welfare departments.\n   • **Coverage:** Exclusively for citizens domiciled in that specific state (e.g., Pudhumai Penn Scheme in Tamil Nadu).\n\n> **Portal Integration:** All 160+ schemes cataloged on this portal are mapped to their respective administrative level with automated domicile validation.`;

        if (language === 'ta') {
          answer = `### மத்திய மற்றும் மாநில அரசு திட்டங்களின் வேறுபாடுகள்\n\nஇந்தியாவில் அரசு நலத்திட்டங்கள் மூன்று முக்கிய பிரிவுகளாக நிர்வகிக்கப்படுகின்றன:\n\n1. **மத்திய துறை திட்டங்கள் (Central Sector):**\n   • **நிதி:** 100% மத்திய அரசால் வழங்கப்படுகிறது.\n   • **நடைமுறை:** மத்திய அமைச்சகங்கள் அல்லது தேசிய போர்டல் (NSP, PM-KISAN) மூலம் நேரடியாக செயல்படுத்தப்படுகிறது.\n\n2. **மத்திய நிதியுதவி திட்டங்கள் (Centrally Sponsored):**\n   • **நிதி:** மத்திய மற்றும் மாநில அரசுகள் இணைந்து நிதியளிக்கின்றன (பொதுவாக 60:40 விகிதம்).\n   • **நடைமுறை:** மாநில அரசு துறைகள் வழியே மாணவர்களுக்கு வழங்கப்படுகிறது (எ.கா. போஸ்ட்-மெட்ரிக் கல்வி உதவித்தொகை).\n\n3. **மாநில அரசு திட்டங்கள் (State Schemes):**\n   • **நிதி:** 100% மாநில அரசின் ஒருங்கிணைந்த நிதியிலிருந்து வழங்கப்படுகிறது.\n   • **நடைமுறை:** சம்பந்தப்பட்ட மாநிலத்தில் வசிக்கும் மாணவர்களுக்கு மட்டுமே பொருந்தும் (எ.கா. புதுமைப் பெண் திட்டம்).`;
        } else if (language === 'hi') {
          answer = `### केंद्रीय और राज्य योजनाओं में अंतर\n\nसरकारी योजनाओं को मुख्य रूप से तीन श्रेणियों में बांटा गया है:\n\n1. **केंद्रीय क्षेत्र की योजनाएं:** 100% केंद्र सरकार द्वारा वित्तपोषित (उदा. राष्ट्रीय छात्रवृत्ति पोर्टल योजनाएं)।\n2. **केंद्र प्रायोजित योजनाएं:** केंद्र और राज्य के बीच लागत साझा (उदा. 60:40 अनुपात, पोस्ट-मैट्रिक छात्रवृत्ति)।\n3. **राज्य योजनाएं:** 100% संबंधित राज्य सरकार द्वारा वित्तपोषित और केवल उसी राज्य के निवासियों के लिए।`;
        }

        return {
          answer,
          intent: 'COMPARE_SCHEMES',
          confidence: 'GROUNDED',
          sources: [
            {
              type: 'SCHEME',
              title: 'Ministry of Finance Government Scheme Classification Standards',
            },
          ],
          actions: [{ type: 'COMPARE_SCHEMES', label: 'Explore & Compare Schemes' }],
          inputTokens: 95,
          outputTokens: 110,
        };
      }

      return {
        answer:
          'Please select schemes in the comparison tool to see side-by-side factual comparisons.',
        intent: 'COMPARE_SCHEMES',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: [],
        actions: [{ type: 'COMPARE_SCHEMES', label: 'Go to Scheme Comparison' }],
        inputTokens: 40,
        outputTokens: 30,
      };
    }

    let answer = `Here is a factual comparison of the **${comp.schemes.length} schemes**:\n\n`;
    comp.schemes.forEach((s, idx: number) => {
      answer += `**${idx + 1}. ${s.name}**\n`;
      answer += `• Application Status: ${s.applicationStatus}\n`;
      answer += `• Documents Required: ${s.requiredDocuments.length} listed\n`;
      answer += `• Benefits: ${s.benefitsSummary.slice(0, 2).join('; ') || 'Standard benefits'}\n\n`;
    });

    answer += `*The platform provides side-by-side facts without algorithmically declaring a preferred scheme.*`;

    if (language === 'ta') {
      answer = `தேர்ந்தெடுக்கப்பட்ட **${comp.schemes.length} திட்டங்களின்** ஒப்பீடு:\n\n`;
      comp.schemes.forEach((s, idx: number) => {
        answer += `**${idx + 1}. ${s.name}**\n`;
        answer += `• விண்ணப்ப நிலை: ${s.applicationStatus}\n`;
        answer += `• தேவையான ஆவணங்கள்: ${s.requiredDocuments.length}\n\n`;
      });
      answer += `*போர்டல் உண்மைத் தரவுகளை மட்டுமே ஒப்பிடுகிறது.*`;
    }

    return {
      answer,
      intent: 'COMPARE_SCHEMES',
      confidence: 'GROUNDED',
      sources: comp.schemes.map((s) => ({ type: 'SCHEME', id: s.id, title: s.name })),
      actions: [{ type: 'COMPARE_SCHEMES', label: 'View Full Side-by-Side Comparison' }],
      inputTokens: 100,
      outputTokens: 80,
    };
  }

  private generateNotificationExplanation(
    context: GroundedContextData,
    language: SupportedLanguage,
  ): AiPromptResponse {
    const notif = context.notification;
    if (!notif) {
      return {
        answer: 'I could not find the specific notification record requested.',
        intent: 'EXPLAIN_NOTIFICATION',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: [],
        actions: [],
        inputTokens: 40,
        outputTokens: 25,
      };
    }

    let answer = `You received the alert **"${notif.title}"** because:\n\n`;
    answer += `${notif.message}\n\n`;
    answer += `• **Notification Type:** ${notif.type}\n`;
    if (notif.sentAt) {
      answer += `• **Dispatched:** ${new Date(notif.sentAt).toLocaleDateString()}\n`;
    }

    if (language === 'ta') {
      answer = `நீங்கள் பெற்ற அறிவிப்பு: **"${notif.title}"**\n\n${notif.message}\n\n• **வகை:** ${notif.type}`;
    }

    const actions: AssistantAction[] = [];
    if (notif.actionUrl) {
      actions.push({ type: 'NAVIGATE', label: 'Open Linked Page', url: notif.actionUrl });
    }

    return {
      answer,
      intent: 'EXPLAIN_NOTIFICATION',
      confidence: 'GROUNDED',
      sources: [{ type: 'NOTIFICATION', id: notif.id, title: notif.title }],
      actions,
      inputTokens: 70,
      outputTokens: 60,
    };
  }

  private generateApplicationSteps(
    context: GroundedContextData,
    language: SupportedLanguage,
  ): AiPromptResponse {
    const scheme = context.scheme;
    const url = scheme?.officialApplicationUrl || scheme?.officialSourceUrl;

    const mandatoryDocs =
      scheme?.requiredDocuments
        ?.filter((d) => d.mandatory)
        .map((d) => d.name)
        .join(', ') || 'required certificates';

    let answer = `Here are the official application steps for **${scheme?.name || 'this scheme'}**:\n\n`;
    answer += `1. **Verify Eligibility:** Confirm your profile details match the age, income, and category rules.\n`;
    answer += `2. **Prepare Mandatory Documents:** Ensure you have verified copies of ${mandatoryDocs}.\n`;
    answer += `3. **Visit the Official Portal:** The portal does not submit applications autonomously. You must apply directly on the government portal.\n`;
    answer += `4. **Submit Application:** Fill the form on the official department portal and save your acknowledgment number.`;

    if (language === 'ta') {
      answer = `**${scheme?.name || 'இந்த திட்டம்'}** விண்ணப்ப படிநிலைகள்:\n\n`;
      answer += `1. **தகுதியை சரிபார்க்கவும்:** உங்கள் வயது மற்றும் வருமான தேவைகளை உறுதி செய்யவும்.\n`;
      answer += `2. **ஆவணங்களை தயார் செய்யவும்:** கட்டாய சான்றிதழ்களை தயாராக வைக்கவும்.\n`;
      answer += `3. **அதிகாரப்பூர்வ போர்ட்டல் செல்லவும்:** விண்ணப்பங்கள் நேரடியாக அரசு போர்ட்டலில் மட்டுமே சமர்ப்பிக்கப்பட வேண்டும்.\n`;
      answer += `4. **விண்ணப்பிக்கவும்:** அரசு இணையதளத்தில் படிவத்தை பூர்த்தி செய்து ரசீதை சேமிக்கவும்.`;
    }

    const actions: AssistantAction[] = [];
    if (url) {
      actions.push({
        type: 'OPEN_OFFICIAL_URL',
        label: 'Open Official Application Portal',
        url,
      });
    }

    return {
      answer,
      intent: 'EXPLAIN_APPLICATION_STEPS',
      confidence: 'GROUNDED',
      sources: scheme
        ? [{ type: 'SCHEME', id: scheme.id, title: scheme.name, url: url || undefined }]
        : [],
      actions,
      inputTokens: 100,
      outputTokens: 90,
    };
  }

  private generateSchemeExplanation(
    context: GroundedContextData,
    language: SupportedLanguage,
    _userMessage: string,
  ): AiPromptResponse {
    const scheme = context.scheme;

    if (!scheme) {
      if (context.matchingSchemes?.length) {
        const topSchemes = context.matchingSchemes.slice(0, 4);
        const sources: SourceReference[] = [];
        const actions: AssistantAction[] = [{ type: 'COMPARE_SCHEMES', label: 'Compare Schemes' }];

        const schemeList = topSchemes
          .map((s, idx) => {
            const ben = s.primaryBenefit
              ? `— ${s.primaryBenefit.type}${s.primaryBenefit.amount ? ` ₹${Number(s.primaryBenefit.amount).toLocaleString('en-IN')}` : ''}`
              : '';
            sources.push({
              type: 'SCHEME',
              id: s.id,
              title: s.name,
              url: s.officialApplicationUrl || undefined,
            });
            if (idx === 0) {
              actions.unshift({
                type: 'VIEW_SCHEME',
                label: `View ${s.name.slice(0, 24)}...`,
                payload: { schemeId: s.id, slug: s.slug },
              });
            }
            return `• **${s.name}**\n  *Department:* ${s.department} ${ben}\n  *Status:* ${s.applicationStatus || 'Application Open'}`;
          })
          .join('\n\n');

        let answer = `### Verified Government Schemes & Scholarships\n\nHere are verified schemes available on the portal matching your request:\n\n${schemeList}\n\nSelect any scheme to inspect complete eligibility conditions, benefits, or official deadlines.`;

        if (language === 'ta') {
          answer = `### போர்ட்டலில் உள்ள சரிபார்க்கப்பட்ட அரசு திட்டங்கள்\n\nபோர்ட்டலில் உள்ள முதன்மை அரசு திட்டங்கள்:\n\n${schemeList}\n\nதிட்ட விவரங்களை அறிய ஏதேனும் ஒரு திட்டத்தைத் தேர்ந்தெடுக்கவும்.`;
        } else if (language === 'hi') {
          answer = `### सत्यापित सरकारी योजनाएँ एवं छात्रवृत्तियाँ\n\nपोर्टल पर उपलब्ध मुख्य योजनाएँ:\n\n${schemeList}\n\nपूर्ण विवरण देखने के लिए किसी भी योजना का चयन करें।`;
        }

        return {
          answer,
          intent: 'GENERAL_SCHEME_QUESTION',
          confidence: 'GROUNDED',
          sources,
          actions,
          inputTokens: 100,
          outputTokens: 110,
        };
      }

      const fallback =
        language === 'ta'
          ? 'நான் போர்ட்டலில் உள்ள அரசு திட்டங்கள், கல்வி உதவித்தொகைகள் மற்றும் உங்கள் தகுதி நிலையை விளக்க உதவும் AI உதவியாளர். நீங்கள் குறிப்பிட்ட திட்டம் பற்றிய சரிபார்க்கப்பட்ட தகவல்கள் கிடைக்கவில்லை.'
          : 'I am the AI Scheme & Scholarship Assistant. I can help explain verified schemes, scholarships, required documents, and your eligibility assessments. Which scheme or topic would you like to explore?';

      return {
        answer: fallback,
        intent: 'GENERAL_SCHEME_QUESTION',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: [],
        actions: [],
        inputTokens: 60,
        outputTokens: 45,
      };
    }

    let answer = `**${scheme.name}** is a government program administered by the **${scheme.department}**.\n\n`;
    answer += `**Description:** ${scheme.shortDescription || scheme.description}\n\n`;

    if (scheme.benefits?.length) {
      answer += `**Key Benefits:**\n`;
      scheme.benefits.forEach((b) => {
        const amt = b.amount ? `₹${Number(b.amount).toLocaleString('en-IN')}` : '';
        answer += `• ${b.benefitType.replace(/_/g, ' ')} ${amt} ${b.frequency ? `(${b.frequency})` : ''} ${b.description ? `- ${b.description}` : ''}\n`;
      });
      answer += '\n';
    }

    if (scheme.activePeriod) {
      answer += `**Application Window:** ${scheme.activePeriod.status} (Closes: ${scheme.activePeriod.closeDate || 'Check official site'})\n\n`;
    }

    if (language === 'ta') {
      answer = `**${scheme.name}** என்பது **${scheme.department}** மூலம் வழங்கப்படும் அரசு திட்டமாகும்.\n\n`;
      answer += `**விளக்கம்:** ${scheme.shortDescription || scheme.description}\n\n`;
      if (scheme.activePeriod) {
        answer += `**விண்ணப்பக் காலம்:** ${scheme.activePeriod.status} (முடிவு: ${scheme.activePeriod.closeDate || 'அதிகாரப்பூர்வ தளத்தைப் பார்க்கவும்'})\n\n`;
      }
    }

    const actions: AssistantAction[] = [
      {
        type: 'VIEW_SCHEME',
        label: 'View Scheme Details',
        payload: { schemeId: scheme.id, slug: scheme.slug },
      },
    ];

    if (scheme.officialApplicationUrl) {
      actions.push({
        type: 'OPEN_OFFICIAL_URL',
        label: 'Open Official Application Portal',
        url: scheme.officialApplicationUrl,
      });
    }

    return {
      answer,
      intent: 'EXPLAIN_SCHEME',
      confidence: 'GROUNDED',
      sources: [
        {
          type: 'SCHEME',
          id: scheme.id,
          title: scheme.name,
          url: scheme.officialSourceUrl || undefined,
        },
      ],
      actions,
      inputTokens: 110,
      outputTokens: 100,
    };
  }
}
