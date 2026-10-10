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
        return this.generateEligibilityExplanation(groundedContext, language);

      case 'EXPLAIN_DOCUMENTS':
      case 'EXPLAIN_OCR_RESULT':
        return this.generateDocumentsExplanation(groundedContext, language);

      case 'SUMMARIZE_SCHEME':
        return this.generateSchemeSummary(groundedContext, language);

      case 'COMPARE_SCHEMES':
        return this.generateComparisonExplanation(groundedContext, language);

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
  ): AiPromptResponse {
    const rec = context.recommendation;
    const scheme = context.scheme;

    if (!rec) {
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
  ): AiPromptResponse {
    const docReadiness = context.documentReadiness;
    const scheme = context.scheme;

    if (!scheme && !docReadiness) {
      return {
        answer:
          language === 'ta'
            ? 'தேவையான ஆவணங்கள் பற்றிய சரிபார்க்கப்பட்ட தகவல்கள் கிடைக்கவில்லை.'
            : 'Verified required document information is not available in the current context.',
        intent: 'EXPLAIN_DOCUMENTS',
        confidence: 'INSUFFICIENT_INFORMATION',
        sources: [],
        actions: [],
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
  ): AiPromptResponse {
    const comp = context.comparison;
    if (!comp || !comp.schemes || comp.schemes.length === 0) {
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
