export interface Sentence {
  chinese: string[] // words in correct order
  pinyin: string
  english: string
  level: number
}

const sentences: Sentence[] = [
  // HSK 1
  { chinese: ['我', '是', '学生'], pinyin: 'Wǒ shì xuéshēng', english: 'I am a student.', level: 1 },
  { chinese: ['他', '不', '喝', '茶'], pinyin: 'Tā bù hē chá', english: 'He does not drink tea.', level: 1 },
  { chinese: ['你', '叫', '什么', '名字'], pinyin: 'Nǐ jiào shénme míngzì', english: 'What is your name?', level: 1 },
  { chinese: ['我', '爱', '中国'], pinyin: 'Wǒ ài Zhōngguó', english: 'I love China.', level: 1 },
  { chinese: ['今天', '天气', '很', '好'], pinyin: 'Jīntiān tiānqì hěn hǎo', english: 'The weather is very good today.', level: 1 },
  { chinese: ['她', '是', '我的', '朋友'], pinyin: 'Tā shì wǒ de péngyǒu', english: 'She is my friend.', level: 1 },
  { chinese: ['我', '想', '吃', '米饭'], pinyin: 'Wǒ xiǎng chī mǐfàn', english: 'I want to eat rice.', level: 1 },
  { chinese: ['你', '住', '在', '哪里'], pinyin: 'Nǐ zhù zài nǎlǐ', english: 'Where do you live?', level: 1 },
  { chinese: ['这', '是', '我的', '书'], pinyin: 'Zhè shì wǒ de shū', english: 'This is my book.', level: 1 },
  { chinese: ['他们', '是', '老师'], pinyin: 'Tāmen shì lǎoshī', english: 'They are teachers.', level: 1 },
  { chinese: ['我', '有', '两', '个', '孩子'], pinyin: 'Wǒ yǒu liǎng gè háizi', english: 'I have two children.', level: 1 },
  { chinese: ['她', '会', '说', '中文'], pinyin: 'Tā huì shuō Zhōngwén', english: 'She can speak Chinese.', level: 1 },
  { chinese: ['明天', '你', '做', '什么'], pinyin: 'Míngtiān nǐ zuò shénme', english: 'What will you do tomorrow?', level: 1 },
  { chinese: ['我们', '去', '学校'], pinyin: 'Wǒmen qù xuéxiào', english: 'We go to school.', level: 1 },
  { chinese: ['他', '在', '家', '看', '电视'], pinyin: 'Tā zài jiā kàn diànshì', english: 'He watches TV at home.', level: 1 },

  // HSK 2
  { chinese: ['我', '每天', '早上', '跑步'], pinyin: 'Wǒ měitiān zǎoshàng pǎobù', english: 'I run every morning.', level: 2 },
  { chinese: ['你', '可以', '帮', '我', '吗'], pinyin: 'Nǐ kěyǐ bāng wǒ ma', english: 'Can you help me?', level: 2 },
  { chinese: ['他', '已经', '到了', '机场'], pinyin: 'Tā yǐjīng dào le jīchǎng', english: 'He has already arrived at the airport.', level: 2 },
  { chinese: ['这个', '房间', '非常', '大'], pinyin: 'Zhège fángjiān fēicháng dà', english: 'This room is very big.', level: 2 },
  { chinese: ['我', '觉得', '这', '很', '有意思'], pinyin: 'Wǒ juéde zhè hěn yǒuyìsi', english: 'I think this is very interesting.', level: 2 },
  { chinese: ['她', '正在', '准备', '考试'], pinyin: 'Tā zhèngzài zhǔnbèi kǎoshì', english: 'She is preparing for the exam.', level: 2 },
  { chinese: ['外面', '下雨', '了'], pinyin: 'Wàimiàn xiàyǔ le', english: 'It is raining outside.', level: 2 },
  { chinese: ['我', '比', '他', '高'], pinyin: 'Wǒ bǐ tā gāo', english: 'I am taller than him.', level: 2 },
  { chinese: ['请', '给', '我', '一杯', '咖啡'], pinyin: 'Qǐng gěi wǒ yì bēi kāfēi', english: 'Please give me a cup of coffee.', level: 2 },
  { chinese: ['他', '从', '北京', '来'], pinyin: 'Tā cóng Běijīng lái', english: 'He comes from Beijing.', level: 2 },

  // HSK 3
  { chinese: ['如果', '明天', '下雨', '我们', '就', '不', '去'], pinyin: 'Rúguǒ míngtiān xiàyǔ wǒmen jiù bú qù', english: "If it rains tomorrow, we won't go.", level: 3 },
  { chinese: ['虽然', '很', '累', '但是', '我', '很', '开心'], pinyin: 'Suīrán hěn lèi dànshì wǒ hěn kāixīn', english: "Although I'm tired, I'm very happy.", level: 3 },
  { chinese: ['他', '一边', '吃饭', '一边', '看', '手机'], pinyin: 'Tā yìbiān chīfàn yìbiān kàn shǒujī', english: 'He eats while looking at his phone.', level: 3 },
  { chinese: ['我', '对', '中国', '文化', '很', '感兴趣'], pinyin: 'Wǒ duì Zhōngguó wénhuà hěn gǎn xìngqù', english: 'I am very interested in Chinese culture.', level: 3 },
  { chinese: ['这件', '衣服', '太', '贵', '了'], pinyin: 'Zhè jiàn yīfú tài guì le', english: 'This piece of clothing is too expensive.', level: 3 },
  { chinese: ['除了', '中文', '他', '还', '会', '说', '英语'], pinyin: 'Chúle Zhōngwén tā hái huì shuō Yīngyǔ', english: 'Besides Chinese, he can also speak English.', level: 3 },
  { chinese: ['你', '应该', '多', '锻炼', '身体'], pinyin: 'Nǐ yīnggāi duō duànliàn shēntǐ', english: 'You should exercise more.', level: 3 },
  { chinese: ['我', '把', '书', '放在', '桌子', '上'], pinyin: 'Wǒ bǎ shū fàng zài zhuōzi shàng', english: 'I put the book on the table.', level: 3 },

  // HSK 4
  { chinese: ['不管', '多', '难', '我', '都', '不会', '放弃'], pinyin: 'Bùguǎn duō nán wǒ dōu bú huì fàngqì', english: "No matter how hard it is, I won't give up.", level: 4 },
  { chinese: ['他', '不但', '聪明', '而且', '很', '努力'], pinyin: 'Tā búdàn cōngmíng érqiě hěn nǔlì', english: 'He is not only smart but also very hardworking.', level: 4 },
  { chinese: ['我', '打算', '明年', '去', '中国', '留学'], pinyin: 'Wǒ dǎsuàn míngnián qù Zhōngguó liúxué', english: 'I plan to study abroad in China next year.', level: 4 },
  { chinese: ['这个', '问题', '值得', '我们', '讨论'], pinyin: 'Zhège wèntí zhídé wǒmen tǎolùn', english: 'This issue is worth our discussion.', level: 4 },
  { chinese: ['随着', '科技', '的', '发展', '生活', '更', '方便', '了'], pinyin: 'Suízhe kējì de fāzhǎn shēnghuó gèng fāngbiàn le', english: 'With the development of technology, life is more convenient.', level: 4 },
  { chinese: ['只要', '你', '努力', '就', '一定', '能', '成功'], pinyin: 'Zhǐyào nǐ nǔlì jiù yídìng néng chénggōng', english: 'As long as you work hard, you will definitely succeed.', level: 4 },

  // HSK 5
  { chinese: ['由于', '交通', '拥挤', '他', '迟到', '了'], pinyin: 'Yóuyú jiāotōng yōngjǐ tā chídào le', english: 'He was late because of traffic congestion.', level: 5 },
  { chinese: ['这部', '电影', '给', '我', '留下了', '深刻', '的', '印象'], pinyin: 'Zhè bù diànyǐng gěi wǒ liú xià le shēnkè de yìnxiàng', english: 'This movie left a deep impression on me.', level: 5 },
  { chinese: ['他', '宁可', '自己', '吃亏', '也', '不', '愿意', '骗', '人'], pinyin: 'Tā nìngkě zìjǐ chīkuī yě bù yuànyì piàn rén', english: 'He would rather suffer losses than deceive others.', level: 5 },
  { chinese: ['我们', '应该', '珍惜', '眼前', '的', '幸福'], pinyin: 'Wǒmen yīnggāi zhēnxī yǎnqián de xìngfú', english: 'We should cherish the happiness we have now.', level: 5 },

  // HSK 6
  { chinese: ['他', '毫不犹豫', '地', '接受了', '这个', '挑战'], pinyin: 'Tā háo bù yóuyù de jiēshòu le zhège tiǎozhàn', english: 'He accepted the challenge without hesitation.', level: 6 },
  { chinese: ['这种', '现象', '在', '当今', '社会', '屡见不鲜'], pinyin: 'Zhè zhǒng xiànxiàng zài dāngjīn shèhuì lǚjiànbùxiān', english: 'This phenomenon is common in today\'s society.', level: 6 },
  { chinese: ['面对', '困难', '我们', '不能', '退缩'], pinyin: 'Miànduì kùnnán wǒmen bù néng tuìsuō', english: 'Facing difficulties, we cannot back down.', level: 6 },
  { chinese: ['实践', '是', '检验', '真理', '的', '唯一', '标准'], pinyin: 'Shíjiàn shì jiǎnyàn zhēnlǐ de wéiyī biāozhǔn', english: 'Practice is the sole criterion for testing truth.', level: 6 },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getSentencesForLevel(maxLevel: number): Sentence[] {
  return sentences.filter((s) => s.level <= maxLevel)
}

export function getRandomSentence(maxLevel: number): Sentence {
  const available = getSentencesForLevel(maxLevel)
  return available[Math.floor(Math.random() * available.length)]
}

export function scrambleWords(words: string[]): string[] {
  // Ensure the scrambled order is different from original
  for (let i = 0; i < 20; i++) {
    const scrambled = shuffle(words)
    if (scrambled.some((w, idx) => w !== words[idx])) return scrambled
  }
  return shuffle(words)
}
