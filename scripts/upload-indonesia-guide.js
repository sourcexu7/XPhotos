const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?client_encoding=utf8'
    }
  }
})

async function main() {
  console.log('开始上传印尼六天五晚旅游攻略...')

  const guide = await prisma.guides.create({
    data: {
      title: '印尼六天五晚旅游攻略',
      country: '印度尼西亚',
      city: '巴厘岛、科莫多',
      days: 6,
      show: 1,
    }
  })

  console.log('攻略创建成功，ID:', guide.id)

  // 交通模块
  const transportModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '交通信息',
      template: 'transport',
      sort: 1,
    }
  })

  const transportData = [
    {
      id: '1',
      type: 'flight',
      route: '南京 → 新加坡 → 吉隆坡 → 科莫多',
      flightNo: 'TR181/TR456/AK336',
      company: '酷航/亚航',
      date: '2026年4月29日-30日',
      time: '17:05 - 次日14:25',
      baggage: '随身10kg(酷航)/随身7kg+付费7kg(亚航)',
      price: 1652,
      notes: '中转新加坡6h25min，吉隆坡4h45min'
    },
    {
      id: '2',
      type: 'flight',
      route: '科莫多 → 巴厘岛',
      flightNo: 'QZ645',
      company: '亚航',
      date: '2026年5月2日',
      time: '08:35 - 09:50',
      baggage: '随身7kg，托运15kg',
      price: 431,
      notes: '直飞'
    },
    {
      id: '3',
      type: 'flight',
      route: '巴厘岛 → 曼谷 → 上海',
      flightNo: 'FD397/SL926',
      company: '亚航/狮航',
      date: '2026年5月5日-6日',
      time: '12:00 - 次日01:30',
      baggage: '随身7kg+付费7kg(亚航)/随身7kg+托运10kg(狮航)',
      price: 1692,
      notes: '中转曼谷4h50min，跨天到达'
    }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: transportModule.id,
      type: 'module_data',
      content: transportData
    }
  })
  console.log('交通模块创建成功')

  // 费用模块
  const expenseModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '费用清单',
      template: 'expense',
      sort: 2,
    }
  })

  const expenseData = [
    { id: '1', name: '南京→科莫多机票', detail: '酷航+亚航联程', type: '飞机', channel: '去哪儿', unitPrice: 1652, subtotal: 1652, category: 'transport', notes: '含中转' },
    { id: '2', name: '科莫多→巴厘岛机票', detail: '亚航QZ645', type: '飞机', channel: '去哪儿', unitPrice: 431, subtotal: 431, category: 'transport', notes: '' },
    { id: '3', name: '巴厘岛→上海机票', detail: '亚航+狮航联程', type: '飞机', channel: '去哪儿', unitPrice: 1692, subtotal: 1692, category: 'transport', notes: '跨天到达' },
    { id: '4', name: '科莫多半日游', detail: '私人快艇', type: '包船', channel: '小红书', unitPrice: 205, subtotal: 205, category: 'ticket', notes: '500k印尼盾' },
    { id: '5', name: '科莫多一日游', detail: '私人快艇8目的地含午餐导游', type: '包船', channel: '小红书', unitPrice: 410, subtotal: 410, category: 'ticket', notes: '1000k印尼盾' },
    { id: '6', name: '科莫多门票', detail: '上岛费', type: '门票', channel: '现场', unitPrice: 164, subtotal: 164, category: 'ticket', notes: '400k印尼盾' },
    { id: '7', name: '滑翔伞', detail: '乌鲁瓦图/Timbis', type: '滑翔伞', channel: '淘宝', unitPrice: 205, subtotal: 205, category: 'ticket', notes: '' },
    { id: '8', name: 'Zasgo Hotel', detail: '至尊双床一室套房 4.30-5.1', type: '双床房', channel: '去哪儿', unitPrice: 167, subtotal: 167, category: 'accommodation', notes: '人均' },
    { id: '9', name: 'Zasgo Hotel', detail: '至尊双床一室套房 5.1-5.2', type: '双床房', channel: '去哪儿', unitPrice: 167, subtotal: 167, category: 'accommodation', notes: '人均' },
    { id: '10', name: 'Sri Phala Resort & Villa', detail: '两卧室花园别墅 5.2-5.3', type: '别墅', channel: '去哪儿', unitPrice: 183.5, subtotal: 183.5, category: 'accommodation', notes: '人均' },
    { id: '11', name: 'Sri Phala Resort & Villa', detail: '两卧室花园别墅 5.3-5.4', type: '别墅', channel: '去哪儿', unitPrice: 183.5, subtotal: 183.5, category: 'accommodation', notes: '人均' },
    { id: '12', name: 'Gaing Mas Jimbaran Villas', detail: '两卧室别墅 5.4-5.5', type: '别墅', channel: '去哪儿', unitPrice: 193, subtotal: 193, category: 'accommodation', notes: '人均' },
    { id: '13', name: '电子签证', detail: '印尼电子签证', type: '签证', channel: '官网', unitPrice: 245, subtotal: 245, category: 'other', notes: '230-260 RMB' },
    { id: '14', name: '印尼盾', detail: '现金兑换', type: '现金', channel: '银行', unitPrice: 3000, subtotal: 3000, category: 'other', notes: '提前预约工商/中行兑换' }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: expenseModule.id,
      type: 'module_data',
      content: expenseData
    }
  })
  console.log('费用模块创建成功')

  // 准备工作模块
  const checklistModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '准备工作',
      template: 'checklist',
      sort: 3,
    }
  })

  const checklistData = [
    {
      id: '1',
      name: '日常用品',
      items: [
        { id: '1-1', name: '身份证、护照、保单', checked: false },
        { id: '1-2', name: '电子签证（提前一周在印尼官网填写）', checked: false },
        { id: '1-3', name: '欧标/德标双圆头转换插头', checked: false },
        { id: '1-4', name: '入境卡（入境前三天印尼官网填写并截图）', checked: false },
        { id: '1-5', name: '境外险、印尼盾（RMB 3000左右）', checked: false },
        { id: '1-6', name: '往返机票行程单 + 酒店确认单', checked: false },
        { id: '1-7', name: '吹风机', checked: false }
      ]
    },
    {
      id: '2',
      name: '衣物准备',
      items: [
        { id: '2-1', name: '日常衣服', checked: false },
        { id: '2-2', name: '防滑溯溪/洞洞鞋', checked: false },
        { id: '2-3', name: '冲锋衣、防晒衣', checked: false },
        { id: '2-4', name: '防晒霜、墨镜', checked: false },
        { id: '2-5', name: '耳塞', checked: false },
        { id: '2-6', name: '密封袋装衣服', checked: false },
        { id: '2-7', name: '遮阳帽', checked: false }
      ]
    },
    {
      id: '3',
      name: '电子产品',
      items: [
        { id: '3-1', name: '蓝牙耳机', checked: false },
        { id: '3-2', name: '充电宝（亚航限160Wh以下，严禁托运）', checked: false },
        { id: '3-3', name: '手表手机数据线', checked: false },
        { id: '3-4', name: '无人机DJI mini5 pro', checked: false },
        { id: '3-5', name: 'Action5 pro', checked: false },
        { id: '3-6', name: '相机：A7C2', checked: false },
        { id: '3-7', name: '镜头：16mm、24-70mm、70-200mm', checked: false },
        { id: '3-8', name: '相机电池、存储卡、读卡器', checked: false },
        { id: '3-9', name: '滤镜：CPL', checked: false }
      ]
    },
    {
      id: '4',
      name: '药品',
      items: [
        { id: '4-1', name: '晕船药（快艇颠簸，提前半小时服用）', checked: false },
        { id: '4-2', name: '肠胃药（蒙脱石散、益生菌）', checked: false }
      ]
    },
    {
      id: '5',
      name: '软件下载',
      items: [
        { id: '5-1', name: 'Grab（打车+外卖）', checked: false },
        { id: '5-2', name: 'Google maps（导航）', checked: false },
        { id: '5-3', name: 'Google 翻译', checked: false }
      ]
    }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: checklistModule.id,
      type: 'module_data',
      content: checklistData
    }
  })
  console.log('清单模块创建成功')

  // 提示模块
  const tipsModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '注意事项',
      template: 'tips',
      sort: 4,
    }
  })

  const tipsData = [
    { id: '1', title: '科莫多无人机', content: '必须通过SIORA系统申请SIMAKSI许可证，建议提前3个工作日完成。核心区拍摄费约2,100,000 IDR/天(约$125)。严禁在巨蜥栖息地上空低飞。', type: 'warning' },
    { id: '2', title: '巴厘岛无人机', content: '寺庙禁区：海神庙、乌鲁瓦图等神庙区域严禁未经许可飞行。合法点位：Pasut黑沙滩、佩尼达岛崖边基本开放，高度限150m以下。', type: 'info' },
    { id: '3', title: '包车攻略', content: '首选Klook、Traveloka或携程等有保障平台预订。一天约300-400元人民币。提前下载WhatsApp与司机沟通。小费建议每天50,000-100,000印尼盾(约20-40元)。', type: 'info' },
    { id: '4', title: '科莫多海鲜街', content: '推荐KEDAI NATALI或KASIMPA WALI。目标价180-250k印尼盾/公斤。挑鱼认准明亮清澈的眼睛。首选烤鱼，鱿鱼BBQ或辣炒。傍晚5点后营业。', type: 'info' },
    { id: '5', title: '防晒提醒', content: '全程做好防晒，紫外线非常强。佩尼达岛日照极强，高倍防晒霜要"往死里涂"。', type: 'warning' },
    { id: '6', title: '科莫多巨蜥', content: '严禁私自靠近。巨蜥有领地意识且带毒，必须跟随向导并保持安全距离。', type: 'warning' },
    { id: '7', title: '情人崖注意事项', content: '不要谷歌地图直接搜情人崖，会定位到Nyang nyang beach。猴子比较多，注意墨镜、帽子、手机被抢。门票50k/人。', type: 'warning' }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: tipsModule.id,
      type: 'module_data',
      content: tipsData
    }
  })
  console.log('提示模块创建成功')

  // 行程模块 - 更详细的排版
  const itineraryModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '行程安排',
      template: 'itinerary',
      sort: 5,
    }
  })

  const itineraryData = [
    {
      id: '1',
      date: '4.30',
      title: '落地科莫多',
      location: '机场 => 码头 => 卡隆岛',
      description: `⏰ 时间安排：
• 14:25 落地科莫多机场
• 15:30 抵达拉布安巴佐码头
• 16:00-18:30 卡隆岛日落包船

🎯 行程亮点：
观看万蝠出巢晚霞，夕阳西下时成千上万只蝙蝠从红树林飞出，场面壮观。

📝 注意事项：
• 全程做好防晒
• 傍晚海上会降温，建议带件薄外套
• 浮潜后记得换上干衣服避免着凉`,
      tips: '住宿：Zasgo Hotel（扎斯戈酒店）\n晚餐：海鲜街自选',
      highlights: ['卡隆岛日落', '万蝠出巢']
    },
    {
      id: '2',
      date: '5.1',
      title: '科莫多一日游',
      location: '帕达尔岛 => 粉红滩 => 科莫多岛 => 浮潜',
      description: `⏰ 时间安排：
• 07:00 码头发船
• 08:30-10:00 帕达尔岛徒步（815级石阶）
• 10:30-12:00 粉红滩拍照+午餐
• 12:30-14:30 科莫多岛寻找巨蜥
• 14:30-16:30 浮潜三连

🎯 行程亮点：
• 帕达尔岛：360°全景俯瞰三色海湾
• 粉红滩：世界七大粉色沙滩之一
• 科莫多巨蜥：世界最大蜥蜴，仅存于印尼
• Manta Point：与魔鬼鱼共游

💰 费用参考：
• 一日游团费：1000k印尼盾/人
• 登岛门票：400k印尼盾/人`,
      tips: '住宿：Zasgo Hotel\n午餐：船上简餐\n晚餐：海鲜街',
      highlights: ['帕达尔岛', '粉红滩', '科莫多巨蜥', 'Manta Point']
    },
    {
      id: '3',
      date: '5.2',
      title: '巴厘岛库塔',
      location: '落地巴厘岛 => 黑沙滩 => 神奇动物园 => 沙努尔',
      description: `⏰ 时间安排：
• 08:35 科莫多起飞
• 09:50 抵达巴厘岛机场
• 12:30-15:00 黑沙滩午餐拍照
• 15:30-17:30 Hidden mini zoo

🎯 行程亮点：
• 黑沙滩：火山黑沙，日落绝美
• 神奇动物园：与动物零距离接触

💰 费用参考：
• 动物园门票：250k印尼盾/人
• 包车：500k-600k印尼盾/12小时`,
      tips: '住宿：Sri Phala Resort & Villa（斯里帕拉别墅度假村）\n午餐：Swan Restaurant Keramas',
      highlights: ['黑沙滩', '神奇动物园']
    },
    {
      id: '4',
      date: '5.3',
      title: '佩尼达岛',
      location: 'Sanur码头 => 钻石沙滩 => 精灵坠崖',
      description: `⏰ 时间安排：
• 07:00 从酒店出发
• 07:30 Sanur码头发船
• 09:00 到达佩尼达岛
• 10:00-11:00 钻石沙滩悬崖S型阶梯拍照
• 13:00-14:30 精灵坠崖Kelingking Beach
• 16:00 快船返回巴厘岛

🎯 行程亮点：
• 钻石沙滩：悬崖S型阶梯，网红打卡点
• 精灵坠崖：世界十大最美海滩之一，霸王龙造型山崖

📝 注意事项：
• 日照极强，高倍防晒霜要"往死里涂"
• 建议穿防滑鞋
• 悬崖边拍照注意安全`,
      tips: '住宿：Sri Phala Resort & Villa\n午餐：岛上简餐',
      highlights: ['钻石沙滩', '精灵坠崖']
    },
    {
      id: '5',
      date: '5.4',
      title: '乌鲁瓦图',
      location: '滑翔伞 => 悬崖公路 => 情人崖 => 金巴兰',
      description: `⏰ 时间安排：
• 11:30-13:30 悬崖滑翔伞
• 15:00-16:30 悬崖公路拍照
• 16:30-17:30 情人崖
• 17:30-19:30 金巴兰晚餐日落

🎯 行程亮点：
• 滑翔伞：从悬崖起飞，俯瞰印度洋
• 悬崖公路：Pantai Tanah Barak，网红公路
• 情人崖：巴厘岛最南端悬崖，日落绝美
• 金巴兰：世界十大最美日落海滩

💰 费用参考：
• 滑翔伞：约200元/人
• 悬崖公路门票：15k/人
• 情人崖门票：50k/人

📝 注意事项：
• 情人崖猴子多，注意墨镜、帽子、手机`,
      tips: '住宿：Gaing Mas Jimbaran Villas（盖茵玛斯金巴兰别墅）\n晚餐：Sakura by Menega',
      highlights: ['滑翔伞', '悬崖公路', '情人崖', '金巴兰日落']
    },
    {
      id: '6',
      date: '5.5',
      title: '回程',
      location: '巴厘岛 => 曼谷 => 上海',
      description: `⏰ 时间安排：
• 09:30 出发前往机场（酒店离机场5km）
• 12:00 航班离境
• 经曼谷中转
• 次日01:30 到达上海

📝 注意事项：
• 提前3小时到机场
• 准备好入境卡和护照
• 跨天航班注意休息`,
      tips: '航班：FD397/SL926',
      highlights: []
    }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: itineraryModule.id,
      type: 'module_data',
      content: itineraryData
    }
  })
  console.log('行程模块创建成功')

  console.log('\n✅ 印尼攻略上传完成！')
  console.log('攻略ID:', guide.id)
  console.log('前台访问地址: http://localhost:3000/guides/' + guide.id)
  console.log('后台编辑地址: http://localhost:3000/admin/guides/' + guide.id + '/edit')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
