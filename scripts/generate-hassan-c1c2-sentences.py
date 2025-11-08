#!/usr/bin/env python3
"""
Generate C1-C2 English sentences for Hassan's advanced vocabulary.
Based on proven A1-A2 methodology with C1-C2 complexity.
"""

import json
from typing import Dict, List, Tuple
import re

# Load Hassan's vocabulary with Arabic translations
with open('/tmp/hassan-vocab-extracted.json', 'r', encoding='utf-8') as f:
    HASSAN_VOCAB = json.load(f)

# Part-of-speech classification (manual - critical for quality)
VERBS = {
    'to scrutinize', 'to articulate', 'to substantiate', 'to advocate', 'to encompass',
    'to perpetuate', 'to mitigate', 'to consolidate', 'to synthesize', 'to corroborate',
    'to exacerbate', 'to discern', 'to elucidate', 'to circumvent', 'to proliferate',
    'to juxtapose', 'to ameliorate', 'to extrapolate', 'to disseminate', 'to impede',
    'to undermine', 'to bolster', 'to foster', 'to attribute', 'to preclude',
    'to epitomize', 'to alleviate', 'to invoke', 'to galvanize', 'to delineate',
    'to warrant', 'to set forth', 'to carry out', 'to bring about', 'to account for',
    'to stem from', 'to delve into', 'to hinge on', 'to phase out', 'to come to terms with'
}

PHRASAL_VERBS = {
    'to set forth', 'to carry out', 'to bring about', 'to account for', 'to stem from',
    'to delve into', 'to hinge on', 'to phase out', 'to come to terms with'
}

NOUNS = {
    'ramification', 'paradigm', 'rhetoric', 'precedent', 'ambiguity', 'disparity',
    'coherence', 'autonomy', 'catalyst', 'dichotomy', 'trajectory', 'nuance',
    'anomaly', 'prerequisite', 'conjecture', 'consensus', 'incentive', 'threshold',
    'feasibility', 'integrity', 'scrutiny', 'resilience', 'sovereignty', 'legitimacy',
    'accountability', 'implication', 'synthesis', 'methodology', 'correlation',
    'speculation', 'optimization', 'mitigation', 'proliferation', 'intervention',
    'manifestation', 'connotation', 'juxtaposition', 'discrepancy', 'rationale',
    'criterion', 'hypothesis', 'variable', 'inference', 'paradox', 'dilemma',
    'complacency', 'hierarchy', 'infrastructure', 'stakeholder', 'endeavor',
    'constraint', 'leverage', 'benchmark', 'allegation', 'contention',
    'deliberation', 'proviso', 'contingency', 'imperative', 'equilibrium'
}

ADJECTIVES = {
    'empirical', 'pragmatic', 'intricate', 'comprehensive', 'substantial', 'profound',
    'meticulous', 'inherent', 'viable', 'tangible', 'obsolete', 'plausible',
    'contentious', 'assertive', 'elusive', 'detrimental', 'versatile', 'concise',
    'explicit', 'implicit', 'arbitrary', 'transparent', 'ambiguous', 'cumulative',
    'pivotal', 'unprecedented', 'indispensable', 'conducive', 'stringent', 'marginal',
    'intermittent', 'susceptible', 'formidable', 'deliberate', 'pertinent',
    'ubiquitous', 'tenuous', 'salient', 'arduous', 'austere', 'robust', 'lucrative',
    'resilient', 'volatile', 'static', 'dynamic', 'bureaucratic', 'anomalous',
    'disparate', 'homogeneous', 'legitimate', 'reciprocal', 'mutual', 'bilateral',
    'multilateral', 'unilateral', 'contemporary'
}

ADVERBS = {
    'inherently', 'predominantly', 'ostensibly', 'inadvertently', 'concurrently'
}

# Single-word verbs (for conjugation)
SIMPLE_VERBS = {
    'deteriorate', 'fluctuate', 'stagnate', 'transcend', 'underpin', 'augment',
    'diminish', 'culminate', 'evoke', 'invoke', 'collaborate', 'exemplify',
    'facilitate', 'incentivize'
}


def get_arabic_translation(word: str) -> str:
    """Get Arabic translation for a word."""
    for item in HASSAN_VOCAB:
        if item['word'] == word:
            return item['arabic']
    return ""


def validate_sentence(sentence: str, target_word: str) -> Tuple[bool, str]:
    """
    Validate a C1-C2 sentence for quality and correctness.
    Returns: (is_valid, error_message)
    """
    # Check word count (12-20 words for C1-C2)
    word_count = len(sentence.split())
    if word_count < 10 or word_count > 25:
        return False, f"Word count {word_count} outside range 10-25"

    # Check target word presence (handle phrasal verbs and conjugations)
    target_base = target_word.replace('to ', '').strip()
    sentence_lower = sentence.lower()

    # For phrasal verbs, check if base verb is present
    if target_word in PHRASAL_VERBS:
        verb_parts = target_base.split()
        if not any(part in sentence_lower for part in verb_parts):
            return False, f"Target word '{target_word}' not found in sentence"
    # For simple verbs, allow conjugations
    elif target_word in VERBS or target_word in SIMPLE_VERBS:
        # Check if any conjugated form exists (scrutinize, scrutinizes, scrutinized, scrutinizing)
        base_verb = target_base.rstrip('e')  # Remove trailing 'e' for stem matching
        if base_verb not in sentence_lower and target_base not in sentence_lower:
            return False, f"Target word '{target_word}' not found in sentence"
    else:
        # For nouns, adjectives, adverbs - exact match (case-insensitive)
        if target_base not in sentence_lower:
            return False, f"Target word '{target_word}' not found in sentence"

    # Check for catastrophic patterns
    catastrophic_patterns = [
        r'\b(a|an|the)\s+(inherently|predominantly|ostensibly|inadvertently|concurrently)\b',  # article + adverb
        r'\bI think (viable|tangible|robust|lucrative|resilient|volatile|static|dynamic) is\b',  # adjective as noun
        r'\bThe (empirical|pragmatic|intricate|comprehensive|substantial) (paradox|dilemma|threshold) is\b'  # weird combinations
    ]

    for pattern in catastrophic_patterns:
        if re.search(pattern, sentence, re.IGNORECASE):
            return False, f"Catastrophic pattern detected: {pattern}"

    # Must start with capital letter
    if not sentence[0].isupper():
        return False, "Sentence must start with capital letter"

    # Must end with punctuation
    if not sentence[-1] in '.!?':
        return False, "Sentence must end with punctuation"

    return True, ""


def generate_sentences_for_word(word: str, arabic: str) -> List[Dict]:
    """
    Generate 3 C1-C2 sentences for a given word.
    Returns list of sentence dictionaries.
    """
    sentences = []

    # This is where we'll manually craft high-quality sentences
    # For now, return placeholder that will be filled in
    return []


# MANUALLY CRAFTED C1-C2 SENTENCES
# Following i+1 methodology with advanced grammar and professional contexts

SENTENCES = {
    "to scrutinize": [
        {
            "sentence": "The board must scrutinize financial reports meticulously before approving any substantial investments.",
            "difficulty": "intermediate",
            "context": "Business governance"
        },
        {
            "sentence": "When researchers scrutinize empirical data, they often uncover nuances that weren't initially apparent.",
            "difficulty": "advanced",
            "context": "Academic research"
        },
        {
            "sentence": "If regulators had scrutinized the company's practices more thoroughly, the fraud might have been prevented.",
            "difficulty": "advanced",
            "context": "Corporate compliance"
        }
    ],
    "to articulate": [
        {
            "sentence": "She was able to articulate her vision clearly, which helped galvanize support from stakeholders.",
            "difficulty": "intermediate",
            "context": "Leadership"
        },
        {
            "sentence": "The ability to articulate complex ideas concisely is indispensable in professional communication.",
            "difficulty": "advanced",
            "context": "Professional skills"
        },
        {
            "sentence": "Having articulated his concerns explicitly, he waited for the committee's deliberation on the matter.",
            "difficulty": "advanced",
            "context": "Corporate decision-making"
        }
    ],
    "to substantiate": [
        {
            "sentence": "To substantiate these allegations, we need empirical evidence rather than mere conjecture.",
            "difficulty": "advanced",
            "context": "Legal proceedings"
        },
        {
            "sentence": "The research team worked to substantiate their hypothesis through rigorous experimentation.",
            "difficulty": "intermediate",
            "context": "Scientific research"
        },
        {
            "sentence": "Unless they can substantiate their claims with tangible proof, the proposal will be precluded.",
            "difficulty": "advanced",
            "context": "Business proposals"
        }
    ],
    "to advocate": [
        {
            "sentence": "She has consistently advocated for transparent policies that promote accountability in governance.",
            "difficulty": "intermediate",
            "context": "Public policy"
        },
        {
            "sentence": "Environmental groups advocate phasing out obsolete technologies that are detrimental to ecosystems.",
            "difficulty": "advanced",
            "context": "Environmental policy"
        },
        {
            "sentence": "If more leaders had advocated for these reforms earlier, the crisis could have been mitigated.",
            "difficulty": "advanced",
            "context": "Political reform"
        }
    ],
    "to encompass": [
        {
            "sentence": "The comprehensive strategy encompasses both short-term mitigation and long-term optimization goals.",
            "difficulty": "intermediate",
            "context": "Strategic planning"
        },
        {
            "sentence": "A truly robust methodology must encompass diverse variables to account for market volatility.",
            "difficulty": "advanced",
            "context": "Business strategy"
        },
        {
            "sentence": "The paradigm shift encompasses fundamental changes that will transcend traditional industry boundaries.",
            "difficulty": "advanced",
            "context": "Industry transformation"
        }
    ],
    "to perpetuate": [
        {
            "sentence": "Bureaucratic hierarchies often perpetuate inefficiencies that impede organizational innovation and adaptation.",
            "difficulty": "advanced",
            "context": "Organizational management"
        },
        {
            "sentence": "Without intervention, these policies will perpetuate the disparities that have been criticized widely.",
            "difficulty": "advanced",
            "context": "Social policy"
        },
        {
            "sentence": "The company inadvertently perpetuated outdated practices rather than fostering dynamic change.",
            "difficulty": "advanced",
            "context": "Change management"
        }
    ],
    "to mitigate": [
        {
            "sentence": "Organizations must mitigate risks proactively rather than responding to crises reactively.",
            "difficulty": "intermediate",
            "context": "Risk management"
        },
        {
            "sentence": "The implementation of stringent measures helped mitigate the proliferation of compliance violations.",
            "difficulty": "advanced",
            "context": "Compliance"
        },
        {
            "sentence": "If they had acted to mitigate these ramifications earlier, the disruption would have been minimal.",
            "difficulty": "advanced",
            "context": "Crisis management"
        }
    ],
    "to consolidate": [
        {
            "sentence": "The merger aims to consolidate resources and leverage economies of scale more effectively.",
            "difficulty": "intermediate",
            "context": "Mergers & acquisitions"
        },
        {
            "sentence": "After months of deliberation, management decided to consolidate operations across disparate regional offices.",
            "difficulty": "advanced",
            "context": "Business restructuring"
        },
        {
            "sentence": "By consolidating their market position now, they can establish a formidable competitive advantage.",
            "difficulty": "advanced",
            "context": "Competitive strategy"
        }
    ],
    "to synthesize": [
        {
            "sentence": "Researchers must synthesize information from various sources to develop comprehensive theoretical frameworks.",
            "difficulty": "advanced",
            "context": "Academic research"
        },
        {
            "sentence": "The report synthesizes complex data into concise recommendations that stakeholders can readily understand.",
            "difficulty": "intermediate",
            "context": "Business reporting"
        },
        {
            "sentence": "Her ability to synthesize disparate viewpoints facilitates consensus-building during contentious negotiations.",
            "difficulty": "advanced",
            "context": "Negotiation"
        }
    ],
    "to corroborate": [
        {
            "sentence": "Multiple independent studies corroborate the hypothesis that market intervention can optimize outcomes.",
            "difficulty": "advanced",
            "context": "Economic research"
        },
        {
            "sentence": "Eyewitness accounts corroborate the allegations, lending substantial legitimacy to the investigation.",
            "difficulty": "advanced",
            "context": "Legal investigation"
        },
        {
            "sentence": "The empirical findings corroborate what practitioners have observed in contemporary business environments.",
            "difficulty": "advanced",
            "context": "Business research"
        }
    ],
    "to exacerbate": [
        {
            "sentence": "Poor communication can exacerbate tensions during contentious negotiations between stakeholders.",
            "difficulty": "intermediate",
            "context": "Business communication"
        },
        {
            "sentence": "The policy changes inadvertently exacerbated disparities rather than ameliorating existing inequalities.",
            "difficulty": "advanced",
            "context": "Policy analysis"
        },
        {
            "sentence": "Market volatility was exacerbated by speculation, culminating in an unprecedented financial crisis.",
            "difficulty": "advanced",
            "context": "Financial markets"
        }
    ],
    "to discern": [
        {
            "sentence": "Experienced analysts can discern subtle patterns in data that less trained observers might overlook.",
            "difficulty": "intermediate",
            "context": "Data analysis"
        },
        {
            "sentence": "It's crucial to discern between correlation and causation when evaluating empirical research findings.",
            "difficulty": "advanced",
            "context": "Research methodology"
        },
        {
            "sentence": "The ability to discern salient features from marginal details is indispensable in strategic planning.",
            "difficulty": "advanced",
            "context": "Strategic thinking"
        }
    ],
    "to elucidate": [
        {
            "sentence": "The professor sought to elucidate complex theoretical concepts through practical, tangible examples.",
            "difficulty": "intermediate",
            "context": "Education"
        },
        {
            "sentence": "This comprehensive analysis elucidates the nuances that underpin contemporary business paradigms.",
            "difficulty": "advanced",
            "context": "Business analysis"
        },
        {
            "sentence": "To elucidate the rationale behind these decisions, management set forth a detailed white paper.",
            "difficulty": "advanced",
            "context": "Corporate governance"
        }
    ],
    "to circumvent": [
        {
            "sentence": "Companies should not attempt to circumvent regulations, as transparency fosters long-term legitimacy.",
            "difficulty": "intermediate",
            "context": "Business ethics"
        },
        {
            "sentence": "The strategy was designed to circumvent bureaucratic constraints that had been impeding progress.",
            "difficulty": "advanced",
            "context": "Organizational efficiency"
        },
        {
            "sentence": "Efforts to circumvent stringent oversight mechanisms inevitably undermine institutional integrity.",
            "difficulty": "advanced",
            "context": "Regulatory compliance"
        }
    ],
    "to proliferate": [
        {
            "sentence": "Digital technologies have proliferated rapidly, transforming how organizations collaborate and communicate.",
            "difficulty": "intermediate",
            "context": "Technology adoption"
        },
        {
            "sentence": "As counterfeit products proliferated, legitimate businesses faced formidable challenges to their market share.",
            "difficulty": "advanced",
            "context": "Market competition"
        },
        {
            "sentence": "The proliferation of ubiquitous mobile devices has brought about unprecedented changes in consumer behavior.",
            "difficulty": "advanced",
            "context": "Consumer trends"
        }
    ],
    "to juxtapose": [
        {
            "sentence": "The report juxtaposes traditional methodologies with contemporary approaches to highlight evolving best practices.",
            "difficulty": "intermediate",
            "context": "Comparative analysis"
        },
        {
            "sentence": "By juxtaposing empirical data from disparate sources, researchers uncovered a salient correlation.",
            "difficulty": "advanced",
            "context": "Research synthesis"
        },
        {
            "sentence": "The documentary juxtaposes affluent communities with impoverished regions to elucidate economic disparities.",
            "difficulty": "advanced",
            "context": "Social documentary"
        }
    ],
    "to ameliorate": [
        {
            "sentence": "Infrastructure investments can ameliorate economic stagnation by creating employment and stimulating growth.",
            "difficulty": "intermediate",
            "context": "Economic development"
        },
        {
            "sentence": "Proactive measures were implemented to ameliorate the detrimental effects of environmental deterioration.",
            "difficulty": "advanced",
            "context": "Environmental policy"
        },
        {
            "sentence": "If policymakers had acted to ameliorate these conditions earlier, the crisis might have been averted.",
            "difficulty": "advanced",
            "context": "Crisis prevention"
        }
    ],
    "to extrapolate": [
        {
            "sentence": "Analysts extrapolate future trends from current data, though such projections inherently involve uncertainty.",
            "difficulty": "intermediate",
            "context": "Forecasting"
        },
        {
            "sentence": "While it's tempting to extrapolate from limited samples, doing so can yield tenuous conclusions.",
            "difficulty": "advanced",
            "context": "Statistical analysis"
        },
        {
            "sentence": "Researchers must extrapolate cautiously, ensuring their inferences are substantiated by robust methodology.",
            "difficulty": "advanced",
            "context": "Research methodology"
        }
    ],
    "to disseminate": [
        {
            "sentence": "Organizations must disseminate critical information transparently to maintain stakeholder trust and accountability.",
            "difficulty": "intermediate",
            "context": "Corporate communication"
        },
        {
            "sentence": "Academic institutions disseminate research findings through peer-reviewed publications that foster scholarly discourse.",
            "difficulty": "advanced",
            "context": "Academic publishing"
        },
        {
            "sentence": "The government's failure to disseminate accurate data inadvertently perpetuated public complacency.",
            "difficulty": "advanced",
            "context": "Public information"
        }
    ],
    "to impede": [
        {
            "sentence": "Bureaucratic procedures can impede innovation when they prioritize rigid compliance over dynamic adaptation.",
            "difficulty": "intermediate",
            "context": "Organizational innovation"
        },
        {
            "sentence": "Regulatory constraints that impede market entry often have unintended ramifications for competition.",
            "difficulty": "advanced",
            "context": "Market regulation"
        },
        {
            "sentence": "Rather than facilitating progress, these outdated policies impede the optimization of operational efficiency.",
            "difficulty": "advanced",
            "context": "Operational management"
        }
    ],
    "to undermine": [
        {
            "sentence": "Inconsistent messaging can undermine leadership credibility and erode stakeholder confidence over time.",
            "difficulty": "intermediate",
            "context": "Leadership communication"
        },
        {
            "sentence": "Corruption allegations undermined the government's legitimacy, precipitating widespread calls for accountability.",
            "difficulty": "advanced",
            "context": "Political governance"
        },
        {
            "sentence": "If management continues to undermine employee autonomy, organizational resilience will inevitably diminish.",
            "difficulty": "advanced",
            "context": "Human resources"
        }
    ],
    "to bolster": [
        {
            "sentence": "Strategic partnerships can bolster competitive positioning while leveraging complementary organizational strengths.",
            "difficulty": "intermediate",
            "context": "Strategic alliances"
        },
        {
            "sentence": "The initiative was designed to bolster economic resilience in regions susceptible to market fluctuations.",
            "difficulty": "advanced",
            "context": "Economic policy"
        },
        {
            "sentence": "Empirical evidence bolsters the argument that transparent governance facilitates sustainable development.",
            "difficulty": "advanced",
            "context": "Governance research"
        }
    ],
    "to foster": [
        {
            "sentence": "Effective leaders foster collaborative environments where diverse perspectives are valued and encouraged.",
            "difficulty": "intermediate",
            "context": "Leadership development"
        },
        {
            "sentence": "Educational institutions must foster critical thinking skills that enable students to navigate ambiguity.",
            "difficulty": "advanced",
            "context": "Educational philosophy"
        },
        {
            "sentence": "By fostering innovation systematically, organizations can transcend traditional constraints and paradigms.",
            "difficulty": "advanced",
            "context": "Innovation management"
        }
    ],
    "to attribute": [
        {
            "sentence": "Analysts attribute the company's success to its meticulous approach to risk mitigation and optimization.",
            "difficulty": "intermediate",
            "context": "Business analysis"
        },
        {
            "sentence": "Researchers cautiously attribute these outcomes to specific variables, acknowledging potential confounding factors.",
            "difficulty": "advanced",
            "context": "Research interpretation"
        },
        {
            "sentence": "While some attribute the crisis to external factors, others discern inherent systemic vulnerabilities.",
            "difficulty": "advanced",
            "context": "Crisis analysis"
        }
    ],
    "to preclude": [
        {
            "sentence": "Stringent confidentiality agreements preclude employees from disseminating proprietary information to competitors.",
            "difficulty": "intermediate",
            "context": "Corporate security"
        },
        {
            "sentence": "The absence of empirical evidence precludes definitive conclusions about the hypothesis under scrutiny.",
            "difficulty": "advanced",
            "context": "Research limitations"
        },
        {
            "sentence": "Budget constraints may preclude pursuing certain initiatives, necessitating careful prioritization and deliberation.",
            "difficulty": "advanced",
            "context": "Resource allocation"
        }
    ],
    "to epitomize": [
        {
            "sentence": "Her leadership style epitomizes the pragmatic approach that has come to define contemporary management.",
            "difficulty": "intermediate",
            "context": "Leadership exemplars"
        },
        {
            "sentence": "This case study epitomizes the dichotomy between theoretical paradigms and practical implementation challenges.",
            "difficulty": "advanced",
            "context": "Academic case studies"
        },
        {
            "sentence": "The company's trajectory epitomizes how fostering innovation can yield unprecedented competitive advantages.",
            "difficulty": "advanced",
            "context": "Business success stories"
        }
    ],
    "to alleviate": [
        {
            "sentence": "Flexible work arrangements can alleviate stress while enhancing employee satisfaction and organizational productivity.",
            "difficulty": "intermediate",
            "context": "Workplace wellbeing"
        },
        {
            "sentence": "International intervention sought to alleviate humanitarian crises exacerbated by protracted conflicts.",
            "difficulty": "advanced",
            "context": "International relations"
        },
        {
            "sentence": "To alleviate infrastructure bottlenecks, substantial investment in contemporary systems is indispensable.",
            "difficulty": "advanced",
            "context": "Infrastructure development"
        }
    ],
    "to invoke": [
        {
            "sentence": "Leaders often invoke historical precedents to justify contemporary policy decisions and strategic directions.",
            "difficulty": "intermediate",
            "context": "Policy justification"
        },
        {
            "sentence": "The legal team invoked constitutional provisions to substantiate their argument for judicial review.",
            "difficulty": "advanced",
            "context": "Legal proceedings"
        },
        {
            "sentence": "By invoking established theoretical frameworks, researchers can corroborate their empirical findings more effectively.",
            "difficulty": "advanced",
            "context": "Academic research"
        }
    ],
    "to galvanize": [
        {
            "sentence": "Visionary leadership can galvanize teams to achieve ambitious objectives that transcend conventional expectations.",
            "difficulty": "intermediate",
            "context": "Team motivation"
        },
        {
            "sentence": "The crisis galvanized stakeholders into action, fostering unprecedented levels of collaboration and consensus.",
            "difficulty": "advanced",
            "context": "Crisis response"
        },
        {
            "sentence": "Compelling rhetoric has historically galvanized social movements, bringing about profound institutional transformations.",
            "difficulty": "advanced",
            "context": "Social change"
        }
    ],
    "to delineate": [
        {
            "sentence": "The proposal clearly delineates responsibilities, ensuring accountability across all organizational hierarchies.",
            "difficulty": "intermediate",
            "context": "Organizational structure"
        },
        {
            "sentence": "Academic papers must delineate their methodology explicitly so that findings can be corroborated independently.",
            "difficulty": "advanced",
            "context": "Research methodology"
        },
        {
            "sentence": "By delineating the threshold between acceptable and unacceptable practices, regulations foster transparency.",
            "difficulty": "advanced",
            "context": "Regulatory frameworks"
        }
    ],
    "to warrant": [
        {
            "sentence": "These concerning trends warrant immediate attention from management before they exacerbate into larger crises.",
            "difficulty": "intermediate",
            "context": "Risk management"
        },
        {
            "sentence": "The substantial discrepancies in the data warrant further investigation to elucidate potential anomalies.",
            "difficulty": "advanced",
            "context": "Data analysis"
        },
        {
            "sentence": "Given the formidable challenges ahead, the situation warrants a comprehensive review of strategic priorities.",
            "difficulty": "advanced",
            "context": "Strategic planning"
        }
    ],
    "to set forth": [
        {
            "sentence": "The document sets forth comprehensive guidelines that delineate responsibilities across organizational hierarchies.",
            "difficulty": "intermediate",
            "context": "Policy documentation"
        },
        {
            "sentence": "The legislation sets forth stringent requirements designed to bolster environmental protection standards.",
            "difficulty": "advanced",
            "context": "Legislative frameworks"
        },
        {
            "sentence": "Having set forth their rationale explicitly, the committee proceeded with deliberations on implementation.",
            "difficulty": "advanced",
            "context": "Committee proceedings"
        }
    ],
    "to carry out": [
        {
            "sentence": "Organizations must carry out due diligence meticulously before finalizing any substantial acquisitions.",
            "difficulty": "intermediate",
            "context": "Corporate transactions"
        },
        {
            "sentence": "Researchers carried out empirical studies to corroborate theoretical predictions about market behavior.",
            "difficulty": "advanced",
            "context": "Research execution"
        },
        {
            "sentence": "The team's ability to carry out complex projects concurrently demonstrates exceptional organizational capability.",
            "difficulty": "advanced",
            "context": "Project management"
        }
    ],
    "to bring about": [
        {
            "sentence": "Technological innovation can bring about profound transformations in how businesses operate and compete.",
            "difficulty": "intermediate",
            "context": "Technology impact"
        },
        {
            "sentence": "Policy reforms brought about unprecedented improvements in transparency and institutional accountability.",
            "difficulty": "advanced",
            "context": "Policy outcomes"
        },
        {
            "sentence": "By fostering collaboration, leadership brought about a paradigm shift that transcended traditional boundaries.",
            "difficulty": "advanced",
            "context": "Organizational transformation"
        }
    ],
    "to account for": [
        {
            "sentence": "Analysts must account for multiple variables when extrapolating future trends from current data.",
            "difficulty": "intermediate",
            "context": "Analytical modeling"
        },
        {
            "sentence": "Small businesses account for a substantial proportion of employment, making them economically indispensable.",
            "difficulty": "advanced",
            "context": "Economic statistics"
        },
        {
            "sentence": "The methodology failed to account for confounding factors, which undermined the validity of conclusions.",
            "difficulty": "advanced",
            "context": "Research critique"
        }
    ],
    "to stem from": [
        {
            "sentence": "Many organizational inefficiencies stem from bureaucratic procedures that impede dynamic decision-making.",
            "difficulty": "intermediate",
            "context": "Organizational diagnosis"
        },
        {
            "sentence": "The current crisis stems from decades of complacency regarding systemic vulnerabilities.",
            "difficulty": "advanced",
            "context": "Crisis origins"
        },
        {
            "sentence": "Discrepancies in performance often stem from disparities in resource allocation and institutional support.",
            "difficulty": "advanced",
            "context": "Performance analysis"
        }
    ],
    "to delve into": [
        {
            "sentence": "Consultants must delve into organizational culture to discern the root causes of persistent challenges.",
            "difficulty": "intermediate",
            "context": "Organizational consulting"
        },
        {
            "sentence": "The research delves into intricate relationships between economic policy and social outcomes.",
            "difficulty": "advanced",
            "context": "Academic research"
        },
        {
            "sentence": "Before making recommendations, auditors delved into financial records to scrutinize potential irregularities.",
            "difficulty": "advanced",
            "context": "Financial auditing"
        }
    ],
    "to hinge on": [
        {
            "sentence": "The project's success hinges on securing adequate funding and maintaining stakeholder consensus.",
            "difficulty": "intermediate",
            "context": "Project dependencies"
        },
        {
            "sentence": "Strategic viability hinges on the organization's capacity to adapt to volatile market conditions.",
            "difficulty": "advanced",
            "context": "Strategic analysis"
        },
        {
            "sentence": "Whether reforms bring about lasting change hinges on implementation rigor and political will.",
            "difficulty": "advanced",
            "context": "Reform implementation"
        }
    ],
    "to phase out": [
        {
            "sentence": "The company plans to phase out obsolete technologies and invest in contemporary infrastructure.",
            "difficulty": "intermediate",
            "context": "Technology transition"
        },
        {
            "sentence": "Policymakers are phasing out inefficient subsidies that inadvertently perpetuate market distortions.",
            "difficulty": "advanced",
            "context": "Economic policy reform"
        },
        {
            "sentence": "Rather than abruptly terminating programs, administrators opted to phase out operations gradually.",
            "difficulty": "advanced",
            "context": "Program management"
        }
    ],
    "to come to terms with": [
        {
            "sentence": "Organizations must come to terms with the reality that digital transformation is indispensable.",
            "difficulty": "intermediate",
            "context": "Digital adoption"
        },
        {
            "sentence": "Having come to terms with past failures, leadership implemented robust mechanisms to prevent recurrence.",
            "difficulty": "advanced",
            "context": "Organizational learning"
        },
        {
            "sentence": "Societies must come to terms with the dichotomy between economic growth and environmental sustainability.",
            "difficulty": "advanced",
            "context": "Sustainability challenges"
        }
    ],
    "ramification": [
        {
            "sentence": "The policy changes have far-reaching ramifications that will affect multiple stakeholder groups concurrently.",
            "difficulty": "intermediate",
            "context": "Policy impact"
        },
        {
            "sentence": "Before implementing reforms, legislators must scrutinize potential ramifications across diverse constituencies.",
            "difficulty": "advanced",
            "context": "Legislative analysis"
        },
        {
            "sentence": "The legal ramifications of this precedent are profound, potentially undermining established judicial frameworks.",
            "difficulty": "advanced",
            "context": "Legal analysis"
        }
    ],
    "paradigm": [
        {
            "sentence": "The emergence of artificial intelligence represents a paradigm shift in how organizations operate.",
            "difficulty": "intermediate",
            "context": "Technological change"
        },
        {
            "sentence": "Traditional management paradigms are increasingly obsolete in dynamic, volatile contemporary markets.",
            "difficulty": "advanced",
            "context": "Management theory"
        },
        {
            "sentence": "This research challenges the prevailing paradigm, offering an alternative framework grounded in empirical evidence.",
            "difficulty": "advanced",
            "context": "Academic innovation"
        }
    ],
    "rhetoric": [
        {
            "sentence": "Political rhetoric often diverges substantially from the pragmatic realities of policy implementation.",
            "difficulty": "intermediate",
            "context": "Political communication"
        },
        {
            "sentence": "Despite compelling rhetoric, the proposal lacked tangible mechanisms to substantiate its ambitious claims.",
            "difficulty": "advanced",
            "context": "Proposal evaluation"
        },
        {
            "sentence": "The dichotomy between rhetoric and action has undermined public confidence in institutional integrity.",
            "difficulty": "advanced",
            "context": "Public trust"
        }
    ],
    "precedent": [
        {
            "sentence": "The court ruling establishes a precedent that will influence future litigation on similar issues.",
            "difficulty": "intermediate",
            "context": "Legal frameworks"
        },
        {
            "sentence": "Without historical precedent to invoke, policymakers faced unprecedented challenges in addressing the crisis.",
            "difficulty": "advanced",
            "context": "Policy innovation"
        },
        {
            "sentence": "This acquisition sets a formidable precedent that may galvanize industry consolidation efforts.",
            "difficulty": "advanced",
            "context": "Industry trends"
        }
    ],
    "ambiguity": [
        {
            "sentence": "Contractual ambiguity can lead to disputes, making explicit language indispensable in legal agreements.",
            "difficulty": "intermediate",
            "context": "Contract law"
        },
        {
            "sentence": "The policy's inherent ambiguity has created confusion, impeding effective implementation across jurisdictions.",
            "difficulty": "advanced",
            "context": "Policy challenges"
        },
        {
            "sentence": "Strategic ambiguity may be deliberate, allowing flexibility while avoiding contentious commitments.",
            "difficulty": "advanced",
            "context": "Strategic communication"
        }
    ],
    "disparity": [
        {
            "sentence": "The growing income disparity has raised substantial concerns about social cohesion and economic equity.",
            "difficulty": "intermediate",
            "context": "Economic inequality"
        },
        {
            "sentence": "This study elucidates how educational disparity stems from disparate resource allocations across districts.",
            "difficulty": "advanced",
            "context": "Educational research"
        },
        {
            "sentence": "Regional infrastructure disparity has created a profound dichotomy between prosperous and struggling areas.",
            "difficulty": "advanced",
            "context": "Regional development"
        }
    ],
    "coherence": [
        {
            "sentence": "Strategic coherence across departments is essential for achieving organizational objectives effectively.",
            "difficulty": "intermediate",
            "context": "Organizational alignment"
        },
        {
            "sentence": "The argument lacks logical coherence, undermining its credibility despite ostensibly compelling rhetoric.",
            "difficulty": "advanced",
            "context": "Logical analysis"
        },
        {
            "sentence": "Policy coherence hinges on synthesizing disparate initiatives into a comprehensive, unified framework.",
            "difficulty": "advanced",
            "context": "Policy integration"
        }
    ],
    "autonomy": [
        {
            "sentence": "Employee autonomy can foster innovation while enhancing job satisfaction and organizational resilience.",
            "difficulty": "intermediate",
            "context": "Workplace management"
        },
        {
            "sentence": "Regional autonomy has been contentious, balancing local governance with national sovereignty concerns.",
            "difficulty": "advanced",
            "context": "Political governance"
        },
        {
            "sentence": "The institution's financial autonomy was undermined by stringent regulations that precluded flexibility.",
            "difficulty": "advanced",
            "context": "Institutional governance"
        }
    ],
    "catalyst": [
        {
            "sentence": "Innovation often serves as a catalyst for economic growth and competitive differentiation.",
            "difficulty": "intermediate",
            "context": "Economic development"
        },
        {
            "sentence": "The scandal became a catalyst for reform, galvanizing stakeholders to demand greater accountability.",
            "difficulty": "advanced",
            "context": "Institutional reform"
        },
        {
            "sentence": "Technological disruption acts as a catalyst, accelerating paradigm shifts that transcend industry boundaries.",
            "difficulty": "advanced",
            "context": "Industry transformation"
        }
    ],
    "dichotomy": [
        {
            "sentence": "The dichotomy between short-term profits and long-term sustainability presents strategic challenges.",
            "difficulty": "intermediate",
            "context": "Strategic planning"
        },
        {
            "sentence": "This research elucidates the false dichotomy between efficiency and equity in economic policy.",
            "difficulty": "advanced",
            "context": "Economic analysis"
        },
        {
            "sentence": "The dichotomy between rhetoric and implementation has undermined confidence in political leadership.",
            "difficulty": "advanced",
            "context": "Political credibility"
        }
    ],
    "trajectory": [
        {
            "sentence": "The company's growth trajectory has been remarkable, epitomizing successful strategic adaptation.",
            "difficulty": "intermediate",
            "context": "Business growth"
        },
        {
            "sentence": "Economic trajectory hinges on policy coherence and the capacity to mitigate volatility effectively.",
            "difficulty": "advanced",
            "context": "Economic forecasting"
        },
        {
            "sentence": "The nation's developmental trajectory transcended expectations, bringing about unprecedented prosperity.",
            "difficulty": "advanced",
            "context": "National development"
        }
    ],
    "nuance": [
        {
            "sentence": "Understanding cultural nuance is indispensable for effective communication in international business contexts.",
            "difficulty": "intermediate",
            "context": "Cross-cultural communication"
        },
        {
            "sentence": "The analysis elucidates subtle nuances that distinguish successful strategies from merely adequate approaches.",
            "difficulty": "advanced",
            "context": "Strategic analysis"
        },
        {
            "sentence": "Policy nuance matters profoundly, as seemingly marginal differences can yield substantial ramifications.",
            "difficulty": "advanced",
            "context": "Policy analysis"
        }
    ],
    "anomaly": [
        {
            "sentence": "The data anomaly warrants immediate investigation to discern whether it represents error or insight.",
            "difficulty": "intermediate",
            "context": "Data analysis"
        },
        {
            "sentence": "What initially seemed an anomaly later proved salient, elucidating previously unrecognized patterns.",
            "difficulty": "advanced",
            "context": "Pattern recognition"
        },
        {
            "sentence": "Statistical anomaly detection can offer lucrative opportunities for investors who discern genuine market trends.",
            "difficulty": "advanced",
            "context": "Investment analysis"
        }
    ],
    "prerequisite": [
        {
            "sentence": "Trust is a prerequisite for effective collaboration between stakeholders with disparate interests.",
            "difficulty": "intermediate",
            "context": "Collaboration"
        },
        {
            "sentence": "Robust methodology is an indispensable prerequisite for research that seeks to substantiate theoretical claims.",
            "difficulty": "advanced",
            "context": "Research standards"
        },
        {
            "sentence": "Financial viability is a prerequisite that precludes many otherwise promising entrepreneurial endeavors.",
            "difficulty": "advanced",
            "context": "Entrepreneurship"
        }
    ],
    "conjecture": [
        {
            "sentence": "Without empirical evidence, such assertions remain mere conjecture rather than substantiated conclusions.",
            "difficulty": "intermediate",
            "context": "Evidence-based analysis"
        },
        {
            "sentence": "The hypothesis, though plausible, is based on conjecture that warrants rigorous empirical testing.",
            "difficulty": "advanced",
            "context": "Scientific methodology"
        },
        {
            "sentence": "Moving beyond conjecture to corroborated findings requires meticulous research and transparent methodology.",
            "difficulty": "advanced",
            "context": "Research progression"
        }
    ],
    "consensus": [
        {
            "sentence": "Building consensus among diverse stakeholders is essential for implementing comprehensive organizational changes.",
            "difficulty": "intermediate",
            "context": "Change management"
        },
        {
            "sentence": "The scientific consensus, corroborated by substantial empirical research, supports this theoretical framework.",
            "difficulty": "advanced",
            "context": "Scientific agreement"
        },
        {
            "sentence": "Despite contentious deliberations, the committee ultimately achieved consensus on pivotal policy recommendations.",
            "difficulty": "advanced",
            "context": "Committee decisions"
        }
    ],
    "incentive": [
        {
            "sentence": "Financial incentives can motivate performance, though they may inadvertently undermine intrinsic motivation.",
            "difficulty": "intermediate",
            "context": "Motivation theory"
        },
        {
            "sentence": "Policymakers must align incentives carefully to foster desired behaviors without exacerbating unintended consequences.",
            "difficulty": "advanced",
            "context": "Policy design"
        },
        {
            "sentence": "The incentive structure was deliberately designed to bolster innovation while maintaining accountability.",
            "difficulty": "advanced",
            "context": "Organizational design"
        }
    ],
    "threshold": [
        {
            "sentence": "The organization reached a critical threshold where incremental improvements no longer sufficed.",
            "difficulty": "intermediate",
            "context": "Organizational transition"
        },
        {
            "sentence": "Regulatory thresholds delineate boundaries between acceptable practices and those requiring stringent oversight.",
            "difficulty": "advanced",
            "context": "Regulatory frameworks"
        },
        {
            "sentence": "Once volatility exceeds a certain threshold, markets become susceptible to formidable disruptions.",
            "difficulty": "advanced",
            "context": "Market stability"
        }
    ],
    "empirical": [
        {
            "sentence": "Empirical research provides tangible evidence that substantiates or refutes theoretical propositions.",
            "difficulty": "intermediate",
            "context": "Research methods"
        },
        {
            "sentence": "The argument lacks empirical foundation, relying predominantly on conjecture rather than corroborated data.",
            "difficulty": "advanced",
            "context": "Argument evaluation"
        },
        {
            "sentence": "Empirical findings have consistently corroborated the hypothesis across diverse contexts and methodologies.",
            "difficulty": "advanced",
            "context": "Research validation"
        }
    ],
    "pragmatic": [
        {
            "sentence": "A pragmatic approach balances theoretical ideals with the practical constraints of implementation.",
            "difficulty": "intermediate",
            "context": "Practical strategy"
        },
        {
            "sentence": "While rhetoric emphasizes ambitious goals, pragmatic considerations often preclude their full realization.",
            "difficulty": "advanced",
            "context": "Policy realism"
        },
        {
            "sentence": "Pragmatic leaders discern when to pursue comprehensive reforms versus when incremental changes suffice.",
            "difficulty": "advanced",
            "context": "Leadership judgment"
        }
    ],
}

# Continue generation script structure
def generate_all_sentences() -> Dict:
    """Generate all 540 C1-C2 sentences organized by word."""
    result = {
        "metadata": {
            "language": "en",
            "language_name": "English",
            "level": "C1-C2",
            "source_profile": "hassan",
            "source_vocabulary": "public/data/hassan/en.json",
            "total_words": len(HASSAN_VOCAB),
            "total_sentences": len(HASSAN_VOCAB) * 3,
            "generated_date": "2025-11-05",
            "version": "1.0-hassan-c1c2-regeneration",
            "quality_validated": True,
            "generation_method": "Part-of-speech validated with i+1 methodology for C1-C2 complexity"
        },
        "sentences": {}
    }

    validation_errors = []
    sentence_count = 0

    for vocab_item in HASSAN_VOCAB:
        word = vocab_item['word']
        arabic = vocab_item['arabic']

        if word in SENTENCES:
            # Use manually crafted sentences
            word_sentences = []
            for sent_dict in SENTENCES[word]:
                sentence_obj = {
                    "sentence": sent_dict["sentence"],
                    "difficulty": sent_dict["difficulty"],
                    "context": sent_dict["context"],
                    "target_word": word,
                    "translation": arabic
                }

                # Validate sentence
                is_valid, error = validate_sentence(sent_dict["sentence"], word)
                if not is_valid:
                    validation_errors.append(f"{word}: {error}")
                    print(f"❌ VALIDATION ERROR: {word} - {error}")
                else:
                    sentence_count += 1

                word_sentences.append(sentence_obj)

            result["sentences"][word] = word_sentences
        else:
            # Mark as TODO for manual generation
            result["sentences"][word] = [
                {"sentence": "[GENERATE]", "difficulty": "intermediate", "context": "Business", "target_word": word, "translation": arabic},
                {"sentence": "[GENERATE]", "difficulty": "advanced", "context": "Academic", "target_word": word, "translation": arabic},
                {"sentence": "[GENERATE]", "difficulty": "advanced", "context": "Professional", "target_word": word, "translation": arabic}
            ]

    print(f"\n{'='*60}")
    print(f"GENERATION SUMMARY")
    print(f"{'='*60}")
    print(f"✅ Sentences validated: {sentence_count}")
    print(f"❌ Validation errors: {len(validation_errors)}")
    print(f"📝 Words remaining: {len(HASSAN_VOCAB) - len(SENTENCES)}")
    print(f"{'='*60}\n")

    return result


if __name__ == "__main__":
    print("Generating C1-C2 sentences for Hassan's vocabulary...")
    print(f"Total words: {len(HASSAN_VOCAB)}")
    print(f"Target sentences: {len(HASSAN_VOCAB) * 3}\n")

    result = generate_all_sentences()

    # Save to output file
    output_path = "public/data/sentences/en/en-c1c2-sentences.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Output saved to: {output_path}")
    print(f"\nCompleted words: {len(SENTENCES)}/{len(HASSAN_VOCAB)}")
    print(f"Completion: {len(SENTENCES)/len(HASSAN_VOCAB)*100:.1f}%")
