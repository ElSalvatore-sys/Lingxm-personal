#!/usr/bin/env python3
"""
Generate Arabic C1-C2 Business Sentences for Remaining 146 Words
High-quality professional business Arabic with complex grammar
"""

import json
import random

# Load remaining words
with open('/tmp/remaining-ar-words.json', 'r', encoding='utf-8') as f:
    remaining_words = json.load(f)

# Load existing sentences
with open('/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/ar/ar-c1c2-sentences.json', 'r', encoding='utf-8') as f:
    existing_sentences = json.load(f)

print(f"Loaded {len(remaining_words)} remaining words")
print(f"Loaded {len(existing_sentences)} existing sentences")

# New sentences to generate
new_sentences = []

# Generate 3 sentences for each word
for word_obj in remaining_words:
    word = word_obj['word']
    translation = word_obj['translation']

    print(f"Generating for: {word} ({translation})")

    if word == "أزمة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تطلبت إدارة الأزمة المالية العالمية تنسيقاً دقيقاً بين البنوك المركزية والحكومات لتجنب انهيار النظام الاقتصادي بأكمله.",
                "translation": "Managing the global financial crisis required precise coordination between central banks and governments to avoid collapse of the entire economic system.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تواجه الشركات الكبرى أزمة ثقة متزايدة مع المستهلكين بسبب ممارساتها البيئية غير المستدامة وعدم شفافيتها المالية.",
                "translation": "Major corporations face an increasing trust crisis with consumers due to their unsustainable environmental practices and financial lack of transparency.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو استعدت الإدارة للأزمة بخطة طوارئ شاملة، لتمكنت من الحد من الأضرار المالية والحفاظ على سمعة العلامة التجارية.",
                "translation": "Had management prepared for the crisis with a comprehensive emergency plan, it could have limited financial damages and preserved the brand reputation.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "صراع":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "نشب صراع استراتيجي طويل بين الشركتين المتنافستين على السيطرة على حصة السوق في قطاع التكنولوجيا المالية الناشئ.",
                "translation": "A long strategic conflict emerged between the two competing companies over control of market share in the emerging financial technology sector.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب حل الصراع المؤسسي الداخلي وساطة محايدة وإيجاد حلول تراعي مصالح جميع الأطراف المعنية بشكل متوازن.",
                "translation": "Resolving internal institutional conflict requires neutral mediation and finding solutions that consider all concerned parties' interests in a balanced manner.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل يمكن تجنب الصراع التجاري المدمر بين الشركات العملاقة من خلال تنظيمات حكومية أكثر صرامة وفعالية؟",
                "translation": "Can destructive commercial conflict between giant corporations be avoided through stricter and more effective government regulations?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "سلام":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يعزز السلام الاجتماعي المستدام الاستقرار الاقتصادي ويشجع الاستثمارات الأجنبية ويحفز النمو طويل الأجل للمجتمعات.",
                "translation": "Sustainable social peace enhances economic stability, encourages foreign investments, and stimulates long-term growth for societies.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تسعى المنظمات الدولية لتعزيز السلام الاقتصادي من خلال اتفاقيات تجارية متعددة الأطراف تحقق منافع متبادلة للجميع.",
                "translation": "International organizations seek to promote economic peace through multilateral trade agreements achieving mutual benefits for all.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو ساد السلام والاستقرار السياسي في المنطقة، لازدهرت الأعمال التجارية وارتفعت معدلات التوظيف بشكل ملحوظ.",
                "translation": "Had peace and political stability prevailed in the region, commercial businesses would have flourished and employment rates would have risen noticeably.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "أمن":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "أصبح الأمن السيبراني أولوية قصوى للمؤسسات المالية نظراً لتزايد التهديدات الإلكترونية وحساسية البيانات المالية للعملاء.",
                "translation": "Cybersecurity has become a top priority for financial institutions due to increasing electronic threats and sensitivity of customer financial data.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب ضمان الأمن الوظيفي للموظفين استراتيجيات موارد بشرية طويلة الأجل وسياسات تدريب مستمرة لتطوير المهارات.",
                "translation": "Ensuring job security for employees requires long-term human resources strategies and continuous training policies to develop skills.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للشركات الموازنة بين تحقيق الأمن المالي واستدامة النمو في ظل التقلبات الاقتصادية العالمية المتزايدة؟",
                "translation": "How can companies balance achieving financial security and growth sustainability amid increasing global economic fluctuations?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "عدالة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تتطلب العدالة التنظيمية داخل الشركات شفافية كاملة في عمليات التقييم والترقية وتوزيع المكافآت على جميع المستويات.",
                "translation": "Organizational justice within companies requires complete transparency in evaluation, promotion, and reward distribution processes at all levels.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يسعى النظام الضريبي العادل إلى تحقيق التوازن بين تحصيل الإيرادات الحكومية وتشجيع الاستثمار ودعم الشرائح الأقل دخلاً.",
                "translation": "A fair tax system seeks to balance government revenue collection, investment encouragement, and support for lower-income segments.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل تضمن السياسات الحالية عدالة توزيع الفرص الاقتصادية بين مختلف الفئات الاجتماعية والمناطق الجغرافية المتنوعة؟",
                "translation": "Do current policies ensure fair distribution of economic opportunities among different social categories and diverse geographical regions?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "حقوق":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تحمي حقوق الملكية الفكرية الابتكارات التكنولوجية وتشجع الاستثمار في البحث والتطوير وتعزز التنافسية العالمية.",
                "translation": "Intellectual property rights protect technological innovations, encourage investment in research and development, and enhance global competitiveness.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يجب على الشركات احترام حقوق العمال الأساسية وتوفير ظروف عمل آمنة وأجور عادلة تتناسب مع تكاليف المعيشة.",
                "translation": "Companies must respect fundamental workers' rights and provide safe working conditions and fair wages commensurate with living costs.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو التزمت جميع المؤسسات بحقوق المستهلكين القانونية، لانخفضت النزاعات التجارية وارتفعت مستويات الرضا العام بشكل ملموس.",
                "translation": "Had all institutions complied with legal consumer rights, commercial disputes would have decreased and general satisfaction levels would have risen tangibly.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "واجبات":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تشمل الواجبات المهنية للمدير التنفيذي اتخاذ قرارات استراتيجية سليمة وحماية مصالح المساهمين وضمان الامتثال التنظيمي.",
                "translation": "Executive director's professional duties include making sound strategic decisions, protecting shareholder interests, and ensuring regulatory compliance.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يجب على الموظفين الالتزام بواجباتهم التعاقدية والحفاظ على سرية المعلومات الحساسة وتجنب تضارب المصالح في العمل.",
                "translation": "Employees must adhere to their contractual duties, maintain confidentiality of sensitive information, and avoid conflicts of interest at work.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن تحقيق التوازن الأمثل بين واجبات الشركة تجاه المساهمين ومسؤولياتها الاجتماعية والبيئية الأوسع نطاقاً؟",
                "translation": "How can optimal balance be achieved between company duties toward shareholders and its broader social and environmental responsibilities?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "مواطن":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يسهم المواطن الفاعل في التنمية الاقتصادية من خلال ريادة الأعمال ودفع الضرائب والمشاركة النشطة في السوق المحلية.",
                "translation": "Active citizens contribute to economic development through entrepreneurship, tax payment, and active participation in the local market.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تسعى برامج التوظيف الحكومية إلى تمكين المواطن اقتصادياً من خلال التدريب المهني وتوفير فرص عمل مستدامة عالية الجودة.",
                "translation": "Government employment programs seek to economically empower citizens through vocational training and providing sustainable high-quality job opportunities.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل توفر السياسات الاقتصادية الحالية للمواطن العادي فرصاً عادلة للتقدم الاجتماعي وتحسين مستوى المعيشة بشكل ملموس؟",
                "translation": "Do current economic policies provide the average citizen with fair opportunities for social advancement and tangible improvement in living standards?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "مجتمع":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يستفيد المجتمع الأعمال من التنوع الثقافي والفكري الذي يحفز الابتكار ويوسع نطاق الفرص التجارية العالمية.",
                "translation": "The business community benefits from cultural and intellectual diversity that stimulates innovation and expands the scope of global commercial opportunities.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تلعب الشركات الكبرى دوراً محورياً في تنمية المجتمع المحلي من خلال برامج المسؤولية الاجتماعية والاستثمار في البنية التحتية.",
                "translation": "Major corporations play a pivotal role in local community development through social responsibility programs and infrastructure investment.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو استثمر المجتمع التجاري بكثافة في التعليم والبحث العلمي، لارتفع مستوى الابتكار والتنافسية الاقتصادية الإقليمية.",
                "translation": "Had the commercial community invested intensively in education and scientific research, innovation levels and regional economic competitiveness would have risen.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "ثقافة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تشكل الثقافة المؤسسية الإيجابية أساساً لجذب المواهب المتميزة والاحتفاظ بها وتعزيز الإنتاجية والولاء المؤسسي.",
                "translation": "Positive organizational culture forms a foundation for attracting and retaining distinguished talents and enhancing productivity and institutional loyalty.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تواجه الشركات متعددة الجنسيات تحديات معقدة في إدارة الثقافة التنظيمية عبر مناطق جغرافية ومجتمعات متنوعة ثقافياً.",
                "translation": "Multinational companies face complex challenges in managing organizational culture across geographically diverse and culturally different communities.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن بناء ثقافة ابتكار حقيقية داخل المؤسسات التقليدية التي تقاوم التغيير وتفضل الأساليب التشغيلية المعتادة؟",
                "translation": "How can genuine innovation culture be built within traditional institutions that resist change and prefer conventional operational methods?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تراث":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يمثل التراث التجاري للعلامة القديمة ميزة تنافسية مهمة تعزز الثقة وتجذب العملاء الباحثين عن الأصالة والجودة.",
                "translation": "The commercial heritage of old brands represents an important competitive advantage enhancing trust and attracting customers seeking authenticity and quality.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستثمر الشركات العائلية في حماية تراثها المؤسسي ونقل القيم والممارسات التجارية الناجحة إلى الأجيال القادمة.",
                "translation": "Family businesses invest in protecting their institutional heritage and transferring successful commercial values and practices to future generations.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل يمكن للشركات الحديثة الاستفادة من التراث الثقافي المحلي في تطوير منتجات مبتكرة تنافسية في الأسواق العالمية؟",
                "translation": "Can modern companies benefit from local cultural heritage in developing innovative competitive products in global markets?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "هوية":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تعكس الهوية المؤسسية القوية قيم الشركة الأساسية ورؤيتها الاستراتيجية وتميزها عن المنافسين في السوق المزدحم.",
                "translation": "Strong corporate identity reflects the company's core values and strategic vision and distinguishes it from competitors in the crowded market.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب بناء الهوية التجارية المتماسكة استثماراً طويل الأجل في التسويق والاتصالات وتجربة العملاء المتسقة عبر القنوات.",
                "translation": "Building cohesive brand identity requires long-term investment in marketing, communications, and consistent customer experience across channels.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو حافظت الشركة على هويتها الأصلية أثناء التوسع الدولي، لتجنبت فقدان الاتصال مع قاعدة عملائها الأساسية والمخلصة.",
                "translation": "Had the company maintained its original identity during international expansion, it would have avoided losing connection with its core and loyal customer base.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تنوع":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يعزز التنوع في فرق العمل الإبداع والابتكار ويوفر منظورات متعددة لحل المشكلات المعقدة وتحسين اتخاذ القرارات.",
                "translation": "Diversity in work teams enhances creativity and innovation and provides multiple perspectives for solving complex problems and improving decision-making.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتبنى الشركات الرائدة استراتيجيات التنوع والشمول لجذب المواهب العالمية وتحسين الأداء المالي وتعزيز السمعة المؤسسية.",
                "translation": "Leading companies adopt diversity and inclusion strategies to attract global talents, improve financial performance, and enhance corporate reputation.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للمؤسسات تحويل التنوع الثقافي من تحدٍ تشغيلي إلى ميزة استراتيجية تدعم التوسع في أسواق دولية متعددة؟",
                "translation": "How can institutions transform cultural diversity from an operational challenge into a strategic advantage supporting expansion in multiple international markets?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "اندماج":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يهدف الاندماج الاستراتيجي بين الشركتين إلى تحقيق وفورات الحجم وتوسيع الحصة السوقية وتعزيز القدرات التنافسية.",
                "translation": "The strategic merger between the two companies aims to achieve economies of scale, expand market share, and enhance competitive capabilities.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تواجه عمليات الاندماج والاستحواذ تحديات ثقافية وتنظيمية معقدة تتطلب تخطيطاً دقيقاً وإدارة تغيير فعالة.",
                "translation": "Mergers and acquisitions face complex cultural and organizational challenges requiring precise planning and effective change management.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو تم الاندماج المؤسسي بطريقة أكثر تدرجاً ومنهجية، لتجنبنا فقدان الموظفين الرئيسيين وتعطل العمليات التشغيلية.",
                "translation": "Had the institutional merger been done more gradually and systematically, we would have avoided losing key employees and disrupting operational processes.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تمييز":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تسبب التمييز في مكان العمل خسائر مالية كبيرة للشركات من خلال انخفاض الإنتاجية ودعاوى قضائية وتدهور السمعة.",
                "translation": "Workplace discrimination causes significant financial losses for companies through decreased productivity, lawsuits, and reputation deterioration.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تطبق المؤسسات الحديثة سياسات صارمة لمكافحة التمييز وضمان فرص متساوية للجميع بغض النظر عن الخلفية الشخصية.",
                "translation": "Modern institutions implement strict anti-discrimination policies and ensure equal opportunities for all regardless of personal background.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل تكفي القوانين الحالية للقضاء على التمييز الهيكلي في التوظيف والترقية داخل القطاعات الاقتصادية المختلفة بشكل فعال؟",
                "translation": "Are current laws sufficient to effectively eliminate structural discrimination in employment and promotion within different economic sectors?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "مساواة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تعزز المساواة في الفرص الاقتصادية النمو الشامل وتحد من التفاوت الاجتماعي وتحسن الاستقرار السياسي طويل الأجل.",
                "translation": "Equality in economic opportunities promotes inclusive growth, reduces social inequality, and improves long-term political stability.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تسعى السياسات الحكومية التقدمية لتحقيق المساواة في الأجور بين الجنسين وضمان تمثيل عادل في المناصب القيادية.",
                "translation": "Progressive government policies seek to achieve gender pay equality and ensure fair representation in leadership positions.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو سادت المساواة الحقيقية في الوصول إلى رأس المال والتمويل، لازدهرت المشاريع الصغيرة وانخفضت معدلات الفقر.",
                "translation": "Had true equality prevailed in access to capital and financing, small enterprises would have flourished and poverty rates would have decreased.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تحيز":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يؤدي التحيز اللاواعي في عمليات التوظيف إلى استبعاد مرشحين مؤهلين ويحد من التنوع والابتكار داخل المؤسسة.",
                "translation": "Unconscious bias in recruitment processes leads to excluding qualified candidates and limits diversity and innovation within the institution.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تنفذ الشركات الرائدة برامج تدريبية مكثفة لتقليل التحيز المعرفي وتحسين عدالة اتخاذ القرارات الإدارية والاستراتيجية.",
                "translation": "Leading companies implement intensive training programs to reduce cognitive bias and improve fairness in administrative and strategic decision-making.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للمؤسسات تصميم أنظمة موضوعية تقلل التحيز البشري في تقييم الأداء وتوزيع المكافآت والترقيات؟",
                "translation": "How can institutions design objective systems that reduce human bias in performance evaluation, reward distribution, and promotions?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "إعلام":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يؤثر الإعلام الاقتصادي المتخصص بشكل كبير على قرارات المستثمرين وتوجهات السوق والثقة في المؤسسات المالية.",
                "translation": "Specialized economic media significantly influences investor decisions, market trends, and trust in financial institutions.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستثمر الشركات الكبرى في علاقات الإعلام الاستراتيجية لإدارة سمعتها ونشر رسائلها التجارية والتعامل مع الأزمات.",
                "translation": "Major corporations invest in strategic media relations to manage their reputation, disseminate commercial messages, and handle crises.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل يحافظ الإعلام المالي على موضوعيته واستقلاليته في ظل التأثيرات التجارية والضغوط من المعلنين الكبار؟",
                "translation": "Does financial media maintain its objectivity and independence amid commercial influences and pressures from major advertisers?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "صحافة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تلعب الصحافة الاستقصائية دوراً حاسماً في كشف الفساد المالي والممارسات التجارية غير الأخلاقية في القطاع الخاص.",
                "translation": "Investigative journalism plays a crucial role in exposing financial corruption and unethical business practices in the private sector.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تواجه الصحافة الاقتصادية تحديات متزايدة في التحقق من صحة المعلومات المالية المعقدة والحفاظ على معايير المهنية العالية.",
                "translation": "Economic journalism faces increasing challenges in verifying complex financial information and maintaining high professional standards.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو تمتعت الصحافة الاقتصادية بمزيد من الاستقلالية المالية، لتمكنت من تقديم تغطية أكثر عمقاً وموضوعية للقضايا.",
                "translation": "Had economic journalism enjoyed more financial independence, it could have provided deeper and more objective coverage of issues.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "مصدر":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يعتمد تحليل السوق الدقيق على مصادر بيانات موثوقة ومتنوعة تشمل التقارير المالية والإحصاءات الحكومية وأبحاث السوق.",
                "translation": "Accurate market analysis depends on reliable and diverse data sources including financial reports, government statistics, and market research.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تسعى الشركات المستدامة لتنويع مصادر المواد الخام والطاقة لتقليل المخاطر التشغيلية والتبعية للموردين الفرديين.",
                "translation": "Sustainable companies seek to diversify raw material and energy sources to reduce operational risks and dependence on individual suppliers.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للمحللين الماليين التحقق من مصداقية المصادر في عصر المعلومات الزائدة والأخبار المضللة المنتشرة؟",
                "translation": "How can financial analysts verify source credibility in an era of information overload and widespread misleading news?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "خبر":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "أثر الخبر العاجل عن الاندماج الكبير على أسعار أسهم الشركتين فوراً وأدى إلى تقلبات واسعة في السوق.",
                "translation": "Breaking news about the major merger immediately affected both companies' stock prices and led to wide market fluctuations.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب نشر الأخبار المالية الحساسة توقيتاً دقيقاً والتزاماً بلوائح الإفصاح لضمان عدالة المعلومات لجميع المستثمرين.",
                "translation": "Publishing sensitive financial news requires precise timing and adherence to disclosure regulations to ensure information fairness for all investors.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل يمكن للمستثمرين الاعتماد على الأخبار الاقتصادية السريعة في اتخاذ قرارات استثمارية مستنيرة وطويلة الأجل؟",
                "translation": "Can investors rely on rapid economic news to make informed and long-term investment decisions?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تحقيق":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "كشف التحقيق المالي الشامل عن مخالفات محاسبية خطيرة وممارسات احتيالية أدت إلى استقالة الإدارة العليا بالكامل.",
                "translation": "The comprehensive financial investigation revealed serious accounting violations and fraudulent practices leading to complete senior management resignation.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب التحقيق الداخلي في المخالفات المؤسسية استقلالية تامة وصلاحيات واضحة وحماية للمبلغين عن المخالفات.",
                "translation": "Internal investigation of institutional violations requires complete independence, clear authorities, and protection for whistleblowers.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو بدأ التحقيق الرقابي في وقت مبكر، لأمكن منع توسع الفساد المالي وحماية أموال المساهمين والمودعين.",
                "translation": "Had the regulatory investigation begun earlier, expansion of financial corruption could have been prevented and shareholders' and depositors' funds protected.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تقرير":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يوفر التقرير السنوي الشامل للشركة معلومات مفصلة عن الأداء المالي والاستراتيجية والحوكمة والمخاطر للمستثمرين.",
                "translation": "The company's comprehensive annual report provides detailed information on financial performance, strategy, governance, and risks for investors.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يعتمد المحللون الماليون على تقارير الأرباح الفصلية لتقييم أداء الشركات وتوقع اتجاهاتها المستقبلية في السوق.",
                "translation": "Financial analysts rely on quarterly earnings reports to evaluate company performance and predict their future market trends.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل تعكس التقارير المالية المنشورة الواقع الاقتصادي الفعلي للشركة أم تخفي مشكلات جوهرية خلف أرقام مضللة؟",
                "translation": "Do published financial reports reflect the company's actual economic reality or hide substantive problems behind misleading numbers?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "رأي عام":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يؤثر الرأي العام السلبي تجاه الشركة بشكل كبير على قيمة علامتها التجارية وقدرتها على جذب المواهب والعملاء.",
                "translation": "Negative public opinion toward the company significantly affects its brand value and ability to attract talents and customers.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستثمر المؤسسات الكبرى في رصد وتحليل الرأي العام لفهم توقعات المجتمع وتكييف استراتيجياتها وفقاً للمعايير الاجتماعية.",
                "translation": "Major institutions invest in monitoring and analyzing public opinion to understand societal expectations and adapt their strategies according to social standards.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للشركات التأثير إيجابياً على الرأي العام دون اللجوء إلى التضليل الإعلامي أو الممارسات غير الأخلاقية؟",
                "translation": "How can companies positively influence public opinion without resorting to media deception or unethical practices?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "استطلاع":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يكشف استطلاع رضا العملاء الشامل عن نقاط القوة والضعف في الخدمات المقدمة ويوجه استراتيجيات التحسين المستقبلية.",
                "translation": "Comprehensive customer satisfaction survey reveals strengths and weaknesses in services provided and guides future improvement strategies.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تعتمد الشركات على استطلاعات السوق المنهجية لفهم احتياجات المستهلكين واتجاهات الصناعة قبل إطلاق منتجات جديدة.",
                "translation": "Companies rely on systematic market surveys to understand consumer needs and industry trends before launching new products.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل تعكس نتائج الاستطلاع الحالي الآراء الحقيقية للفئة المستهدفة أم تعاني من تحيزات منهجية في العينة والأسئلة؟",
                "translation": "Do current survey results reflect true opinions of the target group or suffer from systematic biases in sample and questions?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "بث":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يتيح بث المؤتمرات الصحفية المباشر للمستثمرين والمحللين الوصول الفوري إلى إعلانات الشركة الاستراتيجية والتوضيحات الإدارية.",
                "translation": "Live broadcasting of press conferences allows investors and analysts immediate access to company strategic announcements and management clarifications.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "أصبح البث الرقمي للفعاليات التجارية أداة تسويقية فعالة للوصول إلى جمهور عالمي واسع بتكلفة منخفضة نسبياً.",
                "translation": "Digital broadcasting of commercial events has become an effective marketing tool to reach wide global audiences at relatively low cost.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو استثمرت الشركة في البث التفاعلي للاجتماعات السنوية، لعززت الشفافية وحسنت علاقتها مع صغار المساهمين المهمشين.",
                "translation": "Had the company invested in interactive broadcasting of annual meetings, it would have enhanced transparency and improved relations with marginalized small shareholders.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "محتوى":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يشكل المحتوى الرقمي عالي الجودة عنصراً أساسياً في استراتيجيات التسويق الحديثة لجذب العملاء وبناء الولاء للعلامة.",
                "translation": "High-quality digital content forms an essential element in modern marketing strategies to attract customers and build brand loyalty.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستثمر الشركات بكثافة في إنتاج محتوى تعليمي وترفيهي متخصص يضيف قيمة حقيقية للجمهور ويعزز مكانتها كقادة فكر.",
                "translation": "Companies invest intensively in producing specialized educational and entertainment content adding real value to audiences and enhancing their position as thought leaders.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للمؤسسات قياس العائد الفعلي على الاستثمار في المحتوى التسويقي الرقمي بطريقة دقيقة وقابلة للتحقق؟",
                "translation": "How can institutions measure actual return on investment in digital marketing content in an accurate and verifiable manner?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "نشر":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يخضع نشر البيانات المالية الحساسة لقواعد صارمة تضمن المساواة في الوصول للمعلومات وتمنع التداول بناء على معلومات داخلية.",
                "translation": "Publishing sensitive financial data is subject to strict rules ensuring equal access to information and preventing insider trading.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تعتمد الشركات الرائدة على استراتيجيات نشر منظمة للمحتوى عبر منصات متعددة لتعظيم الوصول والتأثير على الجمهور المستهدف.",
                "translation": "Leading companies rely on organized content publishing strategies across multiple platforms to maximize reach and impact on target audiences.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو أسرعت المؤسسة في نشر معلومات الأزمة بشفافية تامة، لحدت من الشائعات وحافظت على ثقة أصحاب المصلحة.",
                "translation": "Had the institution hastened to publish crisis information with complete transparency, it would have limited rumors and maintained stakeholder trust.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تحرير":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تتطلب عملية تحرير التقارير المالية المهنية دقة عالية وفهماً عميقاً للمعايير المحاسبية والمتطلبات التنظيمية الصارمة.",
                "translation": "Professional financial report editing requires high accuracy and deep understanding of accounting standards and strict regulatory requirements.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يضمن تحرير المحتوى التسويقي الاحترافي تناسق الرسالة التجارية وجودة اللغة وتوافقها مع هوية العلامة التجارية.",
                "translation": "Professional marketing content editing ensures commercial message consistency, language quality, and alignment with brand identity.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن أتمتة عمليات تحرير المستندات التجارية دون فقدان الجودة والدقة اللغوية والامتثال للمعايير المهنية؟",
                "translation": "How can business document editing processes be automated without losing quality, linguistic accuracy, and compliance with professional standards?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "رقابة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تمارس الهيئات التنظيمية رقابة صارمة على المؤسسات المالية لضمان استقرار النظام المصرفي وحماية حقوق المودعين.",
                "translation": "Regulatory bodies exercise strict oversight of financial institutions to ensure banking system stability and protect depositors' rights.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتطلب الرقابة الداخلية الفعالة استقلالية كاملة ل��جهزة التدقيق وآليات إبلاغ واضحة ودعماً قوياً من القيادة العليا.",
                "translation": "Effective internal oversight requires complete audit body independence, clear reporting mechanisms, and strong support from top leadership.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل تكفي آليات الرقابة الحالية لمنع الممارسات الاحتيالية في الأسواق المالية المعقدة والمترابطة عالمياً؟",
                "translation": "Are current oversight mechanisms sufficient to prevent fraudulent practices in complex and globally interconnected financial markets?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "حرية التعبير":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تدعم حرية التعبير في بيئة العمل الابتكار والإبداع من خلال تشجيع الموظفين على مشاركة أفكارهم دون خوف من العقاب.",
                "translation": "Freedom of expression in work environment supports innovation and creativity by encouraging employees to share ideas without fear of punishment.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تواجه الشركات متعددة الجنسيات تحديات في الموازنة بين حرية التعبير للموظفين والامتثال للقوانين المحلية المتباينة.",
                "translation": "Multinational companies face challenges in balancing employee freedom of expression with compliance with varying local laws.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للمؤسسات حماية حرية التعبير الداخلية مع الحفاظ على الاحترافية ومنع التشهير والمضايقات في مكان العمل؟",
                "translation": "How can institutions protect internal freedom of expression while maintaining professionalism and preventing defamation and harassment in the workplace?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "مصداقية":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تعتمد مصداقية المؤسسات المالية على شفافية عملياتها والتزامها بالمعايير الأخلاقية وسجلها الطويل في خدمة العملاء.",
                "translation": "Financial institutions' credibility depends on their operations' transparency, commitment to ethical standards, and long record of customer service.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتآكل مصداقية الشركة تدريجياً عندما تفشل في الوفاء بوعودها أو تخفي معلومات مهمة عن المستثمرين والجمهور.",
                "translation": "Company credibility gradually erodes when it fails to fulfill its promises or hides important information from investors and the public.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو حافظت الإدارة على مصداقيتها خلال الأزمة، لتمكنت من استعادة ثقة السوق بسرعة أكبر وتقليل الخسائر المالية.",
                "translation": "Had management maintained its credibility during the crisis, it could have regained market trust more quickly and reduced financial losses.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "موضوعية":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تتطلب الموضوعية في التقييم المؤسسي معايير واضحة وقابلة للقياس وعمليات شفافة تقلل من التحيزات الشخصية والمحسوبية.",
                "translation": "Objectivity in institutional evaluation requires clear and measurable standards and transparent processes reducing personal biases and nepotism.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يحافظ المحللون الماليون المحترفون على الموضوعية من خلال الفصل الصارم بين توصياتهم الاستثمارية والعلاقات التجارية للشركة.",
                "translation": "Professional financial analysts maintain objectivity through strict separation between their investment recommendations and the company's commercial relationships.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن ضمان الموضوعية في مراجعات الأداء عندما تتداخل العلاقات الشخصية والمصالح المؤسسية المعقدة؟",
                "translation": "How can objectivity be ensured in performance reviews when personal relationships and complex institutional interests overlap?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "انحياز":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يؤدي الانحياز في التقارير المالية إلى تشويه واقع الأداء المؤسسي ويضلل المستثمرين ويقوض ثقة السوق بالكامل.",
                "translation": "Bias in financial reports distorts institutional performance reality, misleads investors, and completely undermines market confidence.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تكافح المؤسسات الحديثة الانحياز المؤسسي من خلال تطبيق سياسات تنوع صارمة وبرامج توعية شاملة لجميع المستويات الإدارية.",
                "translation": "Modern institutions combat institutional bias through implementing strict diversity policies and comprehensive awareness programs for all management levels.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو أدركت اللجنة الانحياز في تحليلاتها الأولية، لأعادت النظر في المنهجية واستخدمت بيانات أكثر تنوعاً وموضوعية.",
                "translation": "Had the committee recognized bias in its initial analyses, it would have reconsidered the methodology and used more diverse and objective data.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "دقة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تعتمد الدقة في التوقعات المالية على جودة البيانات التاريخية والنماذج الإحصائية المتقدمة والفهم العميق لديناميكيات السوق.",
                "translation": "Accuracy in financial forecasts depends on historical data quality, advanced statistical models, and deep understanding of market dynamics.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتطلب الدقة في إعداد الميزانيات التشغيلية تنسيقاً وثيقاً بين الأقسام وتحديثات منتظمة للافتراضات بناء على التغيرات الفعلية.",
                "translation": "Accuracy in preparing operational budgets requires close coordination between departments and regular updates of assumptions based on actual changes.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل يمكن تحسين الدقة في تقديرات الطلب من خلال تقنيات الذكاء الاصطناعي والتعلم الآلي المتطورة؟",
                "translation": "Can accuracy in demand estimates be improved through sophisticated artificial intelligence and machine learning techniques?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "شائعة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تسببت الشائعة حول الصعوبات المالية في انهيار سريع لسعر سهم الشركة قبل أن تنفيها الإدارة بإعلان رسمي.",
                "translation": "The rumor about financial difficulties caused rapid collapse of the company's stock price before management denied it with official announcement.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتطلب إدارة الشائعات المؤسسية الفعالة استجابة سريعة وشفافة ووجوداً قوياً على وسائل التواصل لتصحيح المعلومات المضللة.",
                "translation": "Effective institutional rumor management requires rapid and transparent response and strong social media presence to correct misleading information.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو واجهت الشركة الشائعة بسرعة وحزم، لتجنبت خسارة ملايين الدولارات من القيمة السوقية وثقة المستثمرين.",
                "translation": "Had the company confronted the rumor quickly and firmly, it would have avoided losing millions of dollars in market value and investor confidence.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تحقق":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يتطلب التحقق من صحة البيانات المالية عمليات تدقيق مستقلة شاملة ومراجعة دقيقة للمستندات الداعمة والإجراءات المحاسبية.",
                "translation": "Verifying financial data accuracy requires comprehensive independent audits and careful review of supporting documents and accounting procedures.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستخدم المؤسسات الحديثة تقنيات blockchain للتحقق من أصالة المستندات والمعاملات ومنع التزوير والاحتيال المالي.",
                "translation": "Modern institutions use blockchain technologies to verify document and transaction authenticity and prevent forgery and financial fraud.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن تسريع عمليات التحقق من الامتثال التنظيمي دون التضحية بالدقة والشمولية في الفحص والمراجعة؟",
                "translation": "How can regulatory compliance verification processes be accelerated without sacrificing accuracy and comprehensiveness in examination and review?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "معلومات مضللة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تسبب نشر المعلومات المضللة عن أداء الشركة أضراراً جسيمة لسمعتها وقيمتها السوقية وعلاقاتها مع الشركاء الاستراتيجيين.",
                "translation": "Spreading misinformation about company performance causes severe damage to its reputation, market value, and relationships with strategic partners.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تكافح الهيئات التنظيمية المعلومات المضللة في الأسواق المالية من خلال فرض عقوبات صارمة وتعزيز متطلبات الإفصاح.",
                "translation": "Regulatory bodies combat misinformation in financial markets through imposing strict penalties and enhancing disclosure requirements.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو استثمرت الشركات أكثر في التعليم المالي للجمهور، لانخفض تأثير المعلومات المضللة على قرارات الاستثمار الفردية.",
                "translation": "Had companies invested more in public financial education, the impact of misinformation on individual investment decisions would have decreased.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "وسائل التواصل الاجتماعي":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "أصبحت وسائل التواصل الاجتماعي قناة تسويقية حاسمة تتيح للشركات التفاعل المباشر مع العملاء وبناء مجتمعات حول علامتها.",
                "translation": "Social media has become a crucial marketing channel enabling companies to interact directly with customers and build communities around their brand.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتطلب إدارة وسائل التواصل الاجتماعي للشركات استراتيجية محتوى متماسكة ومراقبة مستمرة واستجابة سريعة للأزمات المحتملة.",
                "translation": "Corporate social media management requires cohesive content strategy, continuous monitoring, and rapid response to potential crises.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن قياس العائد الفعلي على الاستثمار في وسائل التواصل الاجتماعي بما يتجاوز مقاييس المشاركة السطحية؟",
                "translation": "How can actual return on investment in social media be measured beyond superficial engagement metrics?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تفاعل":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يعزز التفاعل المستمر مع العملاء عبر قنوات متعددة الولاء للعلامة التجارية ويوفر رؤى قيمة لتحسين المنتجات والخدمات.",
                "translation": "Continuous customer interaction across multiple channels enhances brand loyalty and provides valuable insights to improve products and services.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب التفاعل الفعال بين الأقسام المختلفة أنظمة اتصال متطورة وثقافة تعاونية وأهدافاً مشتركة واضحة ومتفق عليها.",
                "translation": "Effective interaction between different departments requires advanced communication systems, collaborative culture, and clear agreed-upon shared objectives.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو حسنت الشركة التفاعل الداخلي بين فرق العمل، لارتفعت الكفاءة التشغيلية وانخفضت الأخطاء والتكاليف الزائدة.",
                "translation": "Had the company improved internal interaction between work teams, operational efficiency would have risen and errors and excess costs would have decreased.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تأثير":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يمتد التأثير الاقتصادي للشركات الكبرى إلى ما هو أبعد من أرباحها ليشمل التوظيف وتنمية المجتمعات والابتكار التكنولوجي.",
                "translation": "The economic impact of major corporations extends beyond their profits to include employment, community development, and technological innovation.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب قياس التأثير الاجتماعي للمبادرات المؤسسية منهجيات متقدمة تتجاوز المقاييس المالية التقليدية وتشمل القيمة المجتمعية الشاملة.",
                "translation": "Measuring social impact of institutional initiatives requires advanced methodologies exceeding traditional financial metrics and including comprehensive societal value.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للشركات تعظيم التأثير الإيجابي لعملياتها مع تقليل البصمة البيئية والاستهلاك غير المستدام للموارد؟",
                "translation": "How can companies maximize positive impact of their operations while reducing environmental footprint and unsustainable resource consumption?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "اقتصاد":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يعتمد الاقتصاد الحديث بشكل متزايد على الابتكار التكنولوجي والمعرفة المتخصصة ورأس المال البشري المؤهل عالياً.",
                "translation": "Modern economy increasingly depends on technological innovation, specialized knowledge, and highly qualified human capital.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يواجه الاقتصاد العالمي تحديات غير مسبوقة تتعلق بالتغير المناخي والتفاوت الاجتماعي وتقلبات الأسواق المالية المترابطة.",
                "translation": "Global economy faces unprecedented challenges related to climate change, social inequality, and fluctuations in interconnected financial markets.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو نوع الاقتصاد الوطني مصادر دخله وقلل الاعتماد على قطاع واحد، لأصبح أكثر مرونة في مواجهة الصدمات.",
                "translation": "Had the national economy diversified its income sources and reduced dependence on one sector, it would have become more resilient to shocks.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "تضخم":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يهدد التضخم المرتفع القوة الشرائية للمستهلكين ويقوض الاستثمار طويل الأجل ويخلق عدم يقين اقتصادي واسع النطاق.",
                "translation": "High inflation threatens consumer purchasing power, undermines long-term investment, and creates widespread economic uncertainty.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستخدم البنوك المركزية أدوات السياسة النقدية المتنوعة للسيطرة على التضخم دون إعاقة النمو الاقتصادي المستدام.",
                "translation": "Central banks use diverse monetary policy tools to control inflation without hindering sustainable economic growth.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للشركات حماية هوامش أرباحها من تأثيرات التضخم المتزايد دون رفع الأسعار بشكل يبعد العملاء؟",
                "translation": "How can companies protect profit margins from increasing inflation effects without raising prices in ways that drive away customers?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "ركود":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يتسبب الركود الاقتصادي في انخفاض الإنفاق الاستهلاكي وارتفاع البطالة وتراجع الاستثمارات التجارية بشكل حاد.",
                "translation": "Economic recession causes decreased consumer spending, rising unemployment, and sharp decline in commercial investments.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتطلب مواجهة الركود سياسات مالية ونقدية منسقة تحفز الطلب وتدعم القطاعات المتضررة وتحافظ على الاستقرار المالي.",
                "translation": "Confronting recession requires coordinated fiscal and monetary policies stimulating demand, supporting affected sectors, and maintaining financial stability.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو استعدت الشركات للركود بمرونة مالية كافية واحتياطيات وفيرة، لتمكنت من تجاوز الأزمة بخسائر أقل.",
                "translation": "Had companies prepared for recession with sufficient financial flexibility and abundant reserves, they could have weathered the crisis with fewer losses.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "بطالة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تشكل البطالة المرتفعة بين الشباب تحدياً اجتماعياً واقتصادياً خطيراً يتطلب استثمارات كبيرة في التعليم والتدريب المهني.",
                "translation": "High youth unemployment constitutes a serious social and economic challenge requiring substantial investments in education and vocational training.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تساهم سياسات سوق العمل المرنة والحوافز للشركات في خفض معدلات البطالة وتعزيز فرص التوظيف المستدامة.",
                "translation": "Flexible labor market policies and company incentives contribute to reducing unemployment rates and enhancing sustainable employment opportunities.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو استثمرت الحكومة بكثافة في تأهيل العاطلين عن العمل، لانخفضت البطالة الهيكلية وارتفعت الإنتاجية الاقتصادية الإجمالية.",
                "translation": "Had the government invested intensively in qualifying unemployed people, structural unemployment would have decreased and overall economic productivity would have risen.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "صادرات":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تعتمد الصادرات التنافسية على جودة المنتجات العالية والابتكار المستمر والامتثال للمعايير الدولية الصارمة للأسواق المستهدفة.",
                "translation": "Competitive exports depend on high product quality, continuous innovation, and compliance with strict international standards for target markets.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تسهم الصادرات المتنوعة في استقرار الميزان التجاري وتقليل الاعتماد على سوق واحد وتعزيز مرونة الاقتصاد الوطني.",
                "translation": "Diversified exports contribute to trade balance stability, reducing dependence on one market, and enhancing national economy resilience.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للشركات الصغيرة والمتوسطة زيادة صادراتها رغم محدودية الموارد والخبرة في الأسواق الدولية المعقدة؟",
                "translation": "How can small and medium enterprises increase their exports despite limited resources and experience in complex international markets?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "واردات":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تؤثر الواردات الكبيرة من المنتجات الرخيصة على الصناعات المحلية وتتسبب في فقدان وظائف وتزيد العجز التجاري.",
                "translation": "Large imports of cheap products affect local industries, cause job losses, and increase trade deficit.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتطلب إدارة الواردات الاستراتيجية توازناً دقيقاً بين حماية الصناعات الوطنية وتوفير خيارات متنوعة للمستهلكين بأسعار تنافسية.",
                "translation": "Strategic import management requires delicate balance between protecting national industries and providing diverse consumer options at competitive prices.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو فرضت الحكومة رسوماً جمركية أعلى على الواردات الفاخرة، لعززت الإيرادات العامة وشجعت الاستهلاك المحلي.",
                "translation": "Had the government imposed higher customs duties on luxury imports, it would have enhanced public revenues and encouraged local consumption.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "ميزان تجاري":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يعكس الميزان التجاري الإيجابي قوة الاقتصاد التنافسية وقدرته على إنتاج سلع وخدمات مطلوبة في الأسواق العالمية.",
                "translation": "Positive trade balance reflects economy's competitive strength and its ability to produce goods and services demanded in global markets.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "يتطلب تحسين الميزان التجاري استراتيجية شاملة تجمع بين تعزيز الصادرات وتقليل الاعتماد على الواردات غير الضرورية.",
                "translation": "Improving trade balance requires comprehensive strategy combining export enhancement and reducing dependence on unnecessary imports.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "هل يمكن الحفاظ على ميزان تجاري صحي في ظل المنافسة العالمية الشرسة وتقلبات أسعار الصرف المستمرة؟",
                "translation": "Can healthy trade balance be maintained amid fierce global competition and continuous exchange rate fluctuations?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "عملة":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "تعتمد قوة العملة الوطنية على استقرار الاقتصاد واحتياطيات النقد الأجنبي والسياسات النقدية الحكيمة للبنك المركزي.",
                "translation": "National currency strength depends on economy stability, foreign exchange reserves, and wise monetary policies of the central bank.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تستخدم الشركات متعددة الجنسيات استراتيجيات تحوط معقدة للحماية من مخاطر تقلبات العملات في عملياتها العالمية.",
                "translation": "Multinational companies use complex hedging strategies to protect against currency fluctuation risks in their global operations.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "لو حافظت الحكومة على استقرار العملة، لتعززت ثقة المستثمرين وانخفضت تكاليف الاستيراد والتضخم المستورد.",
                "translation": "Had the government maintained currency stability, investor confidence would have been enhanced and import costs and imported inflation would have decreased.",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

    elif word == "سعر صرف":
        new_sentences.extend([
            {
                "word": word,
                "sentence": "يؤثر سعر الصرف بشكل مباشر على تنافسية الصادرات وتكلفة الواردات والاستثمارات الأجنبية المباشرة في الاقتصاد.",
                "translation": "Exchange rate directly affects export competitiveness, import costs, and foreign direct investments in the economy.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "تتدخل البنوك المركزية في أسواق العملات لتثبيت سعر الصرف ومنع التقلبات الحادة التي تضر بالاستقرار الاقتصادي.",
                "translation": "Central banks intervene in currency markets to stabilize exchange rates and prevent sharp fluctuations harming economic stability.",
                "level": "C1-C2",
                "language": "ar"
            },
            {
                "word": word,
                "sentence": "كيف يمكن للشركات المصدرة الاستفادة من تحركات سعر الصرف دون تعريض عملياتها لمخاطر مالية غير محسوبة؟",
                "translation": "How can exporting companies benefit from exchange rate movements without exposing their operations to uncalculated financial risks?",
                "level": "C1-C2",
                "language": "ar"
            }
        ])

print(f"\nTotal new sentences generated: {len(new_sentences)}")
print(f"Combining with existing {len(existing_sentences)} sentences...")

# Combine and save
all_sentences = existing_sentences + new_sentences
print(f"Total sentences in file: {len(all_sentences)}")

# Save to file
output_path = '/Users/eldiaploo/Desktop/LingXM-Personal/public/data/sentences/ar/ar-c1c2-sentences.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_sentences, f, ensure_ascii=False, indent=2)

print(f"\nSaved to: {output_path}")

# Print 10 random examples from new sentences
print("\n" + "="*80)
print("10 RANDOM EXAMPLES FROM NEW SENTENCES:")
print("="*80)
random_samples = random.sample(new_sentences, min(10, len(new_sentences)))
for i, sent in enumerate(random_samples, 1):
    print(f"\n{i}. Word: {sent['word']}")
    print(f"   Arabic: {sent['sentence']}")
    print(f"   English: {sent['translation']}")

print("\n" + "="*80)
print("GENERATION COMPLETE!")
print("="*80)
print(f"✓ New sentences generated: {len(new_sentences)}")
print(f"✓ Total sentences in file: {len(all_sentences)}")
print(f"✓ Words covered: {len(new_sentences) // 3}")
