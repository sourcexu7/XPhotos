const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?client_encoding=utf8'
    }
  }
})

async function main() {
  console.log('开始上传西北八天七晚环线攻略...')

  const guide = await prisma.guides.create({
    data: {
      title: '西北八天七晚环线攻略',
      country: '中国',
      city: '西北大环线',
      days: 8,
      show: 1,
    }
  })

  console.log('攻略创建成功，ID:', guide.id)

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
      route: '扬州泰州机场T2 - 中川机场T2',
      flightNo: '9C7371',
      company: '春秋航空',
      date: '2025年3月29日',
      time: '7:00 - 10:05',
      baggage: '7kg随身，20kg托运34寸',
      price: 336,
      notes: '时长3h5min，200是之前延误赔偿的优惠券'
    },
    {
      id: '2',
      type: 'flight',
      route: '中川机场T3 - 禄口机场T2',
      flightNo: 'MU2359',
      company: '东方航空',
      date: '2025年4月6日',
      time: '11:00 - 13:40',
      baggage: '8kg随身20寸，20kg托运34寸',
      price: 479,
      notes: '时长1h40min，行享东方次卡'
    },
    {
      id: '3',
      type: 'car',
      company: '租车自驾',
      model: '西北环线',
      pickup: '兰州',
      dropoff: '兰州',
      days: 7,
      date: '2025年3月30日-4月5日',
      time: '7天',
      price: 959.5,
      notes: '车费人均442.25 + 油费人均380.5 + 高速费人均136.75'
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

  const expenseModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '费用清单',
      template: 'expense',
      sort: 2,
    }
  })

  const expenseData = [
    { id: '1', name: '南京-扬州高铁', detail: '高铁', type: '高铁', channel: '12306', unitPrice: 56, subtotal: 56, category: 'transport', notes: '' },
    { id: '2', name: '扬州-兰州机票', detail: '春秋航空 9C7371', type: '飞机', channel: '春秋航空', unitPrice: 336, subtotal: 336, category: 'transport', notes: '7:00-10:05' },
    { id: '3', name: '兰州-南京机票', detail: '东方航空 MU2359', type: '飞机', channel: '东方航空', unitPrice: 479, subtotal: 479, category: 'transport', notes: '11:00-13:40' },
    { id: '4', name: '家-南京站打车', detail: '', type: '打车', channel: '', unitPrice: 21, subtotal: 21, category: 'transport', notes: '' },
    { id: '5', name: '扬州东-扬泰机场酒店打车', detail: '', type: '打车', channel: '', unitPrice: 43, subtotal: 43, category: 'transport', notes: '' },
    { id: '6', name: '南京南站-家打车', detail: '', type: '打车', channel: '', unitPrice: 23, subtotal: 23, category: 'transport', notes: '' },
    { id: '7', name: '租车车费', detail: '人均', type: '租车', channel: '', unitPrice: 442.25, subtotal: 442.25, category: 'transport', notes: '7天租车' },
    { id: '8', name: '油费', detail: '人均', type: '租车', channel: '', unitPrice: 380.5, subtotal: 380.5, category: 'transport', notes: '' },
    { id: '9', name: '高速费', detail: '人均', type: '租车', channel: '', unitPrice: 136.75, subtotal: 136.75, category: 'transport', notes: '清明假期部分免费' },
    { id: '10', name: '大疆Air3S租赁', detail: '带屏+3电+安心享', type: '无人机', channel: '支付宝探物', unitPrice: 441, subtotal: 441, category: 'equipment', notes: '' },
    { id: '11', name: '腾龙50-300租赁', detail: '', type: '镜头', channel: '芝麻租赁/兰拓相机', unitPrice: 227, subtotal: 227, category: 'equipment', notes: '' },
    { id: '12', name: 'Action5 Pro租赁', detail: '', type: '运动相机', channel: '人人租', unitPrice: 230, subtotal: 230, category: 'equipment', notes: '' },
    { id: '13', name: 'Pocket3全能套装租赁', detail: '安心服务8天', type: 'Vlog相机', channel: '支付宝惠租/芳华相机', unitPrice: 304, subtotal: 304, category: 'equipment', notes: '' },
    { id: '14', name: '日月山门票', detail: '淡季半价', type: '门票', channel: '闲鱼', unitPrice: 28.5, subtotal: 28.5, category: 'ticket', notes: '' },
    { id: '15', name: '青海湖门票', detail: '', type: '门票', channel: '', unitPrice: 50, subtotal: 50, category: 'ticket', notes: '' },
    { id: '16', name: '大柴旦翡翠湖', detail: '门票+观光车，淡季半价', type: '门票', channel: '', unitPrice: 90, subtotal: 90, category: 'ticket', notes: '' },
    { id: '17', name: '察尔汗盐湖', detail: '门票+摆渡车', type: '门票', channel: '', unitPrice: 80, subtotal: 80, category: 'ticket', notes: '' },
    { id: '18', name: '水上雅丹', detail: '门票+观光车', type: '门票', channel: '', unitPrice: 90, subtotal: 90, category: 'ticket', notes: '' },
    { id: '19', name: '七彩丹霞', detail: '观光车', type: '门票', channel: '', unitPrice: 94.5, subtotal: 94.5, category: 'ticket', notes: '' },
    { id: '20', name: '莫高窟门票', detail: '8个窟', type: '门票', channel: '', unitPrice: 0, subtotal: 0, category: 'ticket', notes: '261.3元/人(未计入)' },
    { id: '21', name: '汉庭兰州中心省博物馆店', detail: '大床房 3.29-30', type: '大床房', channel: '美团', unitPrice: 168.26, subtotal: 168.26, category: 'accommodation', notes: '' },
    { id: '22', name: '7天优品德令哈巴音河店', detail: '优品大床 3.30-31', type: '大床房', channel: '美团', unitPrice: 133, subtotal: 133, category: 'accommodation', notes: '' },
    { id: '23', name: '希岸酒店海西大柴旦店', detail: '豪华大床 3.31-4.1', type: '大床房', channel: '携程', unitPrice: 208, subtotal: 208, category: 'accommodation', notes: '' },
    { id: '24', name: '希岸酒店海西大柴旦店', detail: '豪华大床 4.1-4.2', type: '大床房', channel: '携程', unitPrice: 201, subtotal: 201, category: 'accommodation', notes: '' },
    { id: '25', name: '茫崖星际品质宾馆', detail: '大床房 4.2-4.3', type: '大床房', channel: '美团', unitPrice: 180, subtotal: 180, category: 'accommodation', notes: '' },
    { id: '26', name: '敦煌云天国际酒店', detail: '高级大床 4.3-4.4', type: '大床房', channel: '美团', unitPrice: 0, subtotal: 0, category: 'accommodation', notes: '188元(未计入)' },
    { id: '27', name: '汉庭张掖大佛寺店', detail: '高级大床 4.4-4.5', type: '大床房', channel: '美团', unitPrice: 186.82, subtotal: 186.82, category: 'accommodation', notes: '' },
    { id: '28', name: '兰州机场君江酒店', detail: '君怡大床 4.5-4.6', type: '大床房', channel: '去哪儿', unitPrice: 150, subtotal: 150, category: 'accommodation', notes: '' },
    { id: '29', name: '享遇海鲜牛排自助兰州中心店', detail: '3.29晚餐', type: '晚饭', channel: '', unitPrice: 97, subtotal: 97, category: 'food', notes: '' },
    { id: '30', name: '西宁茶餐厅', detail: '3.30午餐（报吃）', type: '午饭', channel: '', unitPrice: 37.75, subtotal: 37.75, category: 'food', notes: '' },
    { id: '31', name: '德令哈老严烤肉总店', detail: '3.30晚餐', type: '晚饭', channel: '', unitPrice: 52.25, subtotal: 52.25, category: 'food', notes: '' },
    { id: '32', name: '德令哈阿秦嫂手工面', detail: '3.31午餐', type: '午饭', channel: '', unitPrice: 17, subtotal: 17, category: 'food', notes: '' },
    { id: '33', name: '大柴旦顶顶牛干锅牦牛肉', detail: '3.31晚餐', type: '晚饭', channel: '', unitPrice: 60.5, subtotal: 60.5, category: 'food', notes: '' },
    { id: '34', name: '伊布拉特色炕锅开锅涮', detail: '4.1午餐', type: '午饭', channel: '', unitPrice: 86, subtotal: 86, category: 'food', notes: '' },
    { id: '35', name: '外卖', detail: '4.1晚餐', type: '晚饭', channel: '', unitPrice: 62.5, subtotal: 62.5, category: 'food', notes: '' },
    { id: '36', name: '水上雅丹德克士', detail: '4.2午餐', type: '午饭', channel: '', unitPrice: 53.25, subtotal: 53.25, category: 'food', notes: '' },
    { id: '37', name: '冷湖镇星客来酒家', detail: '4.2晚餐', type: '晚饭', channel: '', unitPrice: 69, subtotal: 69, category: 'food', notes: '' },
    { id: '38', name: '冷湖镇星客来酒家', detail: '4.3早餐', type: '早饭', channel: '', unitPrice: 14.75, subtotal: 14.75, category: 'food', notes: '' },
    { id: '39', name: '驴爸爸敦煌菜', detail: '4.3晚餐', type: '晚饭', channel: '', unitPrice: 87.5, subtotal: 87.5, category: 'food', notes: '杏皮茶好喝' },
    { id: '40', name: '筷上瘾牛肉面', detail: '4.4早餐', type: '早饭', channel: '', unitPrice: 16, subtotal: 16, category: 'food', notes: '' },
    { id: '41', name: '王掌柜木桶鱼', detail: '4.4晚餐', type: '晚饭', channel: '', unitPrice: 67, subtotal: 67, category: 'food', notes: '' },
    { id: '42', name: '苏尼特水煮羊', detail: '4.5午餐', type: '午饭', channel: '', unitPrice: 72.5, subtotal: 72.5, category: 'food', notes: '' },
    { id: '43', name: 'KFC', detail: '4.5晚餐', type: '晚饭', channel: '', unitPrice: 29, subtotal: 29, category: 'food', notes: '' },
    { id: '44', name: '零食', detail: '人均', type: '零食', channel: '', unitPrice: 117.25, subtotal: 117.25, category: 'other', notes: '48+85+47+39+167+83' },
    { id: '45', name: '购物', detail: '人均', type: '购物', channel: '', unitPrice: 65.5, subtotal: 65.5, category: 'shopping', notes: '158+44+60' }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: expenseModule.id,
      type: 'module_data',
      content: expenseData
    }
  })
  console.log('费用模块创建成功')

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
      name: '衣物准备',
      items: [
        { id: '1-1', name: '拍照衣物（绿色卫衣+牛仔裤、秋裤+速干衣、短袖两件、绿色冲锋衣+黑色的卫衣*2+黑色牛仔裤、黑色冲锋衣+运动裤、红色毛衣、皮衣+格子衫+工装裤、古装*3）', checked: false },
        { id: '1-2', name: '运动裤、内裤', checked: false },
        { id: '1-3', name: '墨镜', checked: false },
        { id: '1-4', name: '两条项链', checked: false },
        { id: '1-5', name: '冷帽', checked: false },
        { id: '1-6', name: '羽绒服', checked: false },
        { id: '1-7', name: '防晒霜', checked: false },
        { id: '1-8', name: '防晒面罩', checked: false }
      ]
    },
    {
      id: '2',
      name: '药品',
      items: [
        { id: '2-1', name: '布洛芬', checked: false },
        { id: '2-2', name: '999感冒灵', checked: false },
        { id: '2-3', name: '止泻药', checked: false }
      ]
    },
    {
      id: '3',
      name: '日常用品',
      items: [
        { id: '3-1', name: '身份证、驾照', checked: false },
        { id: '3-2', name: '蓝牙耳机', checked: false },
        { id: '3-3', name: '刮胡刀', checked: false },
        { id: '3-4', name: '手机充电器、充电宝、手表充电器', checked: false },
        { id: '3-5', name: '卫生纸4包、防晒霜', checked: false },
        { id: '3-6', name: '头枕、雨伞、唇膏', checked: false },
        { id: '3-7', name: '漱口水', checked: false },
        { id: '3-8', name: '徕芬吹风机', checked: false },
        { id: '3-9', name: '香水', checked: false },
        { id: '3-10', name: '夹板', checked: false }
      ]
    },
    {
      id: '4',
      name: '食物',
      items: [
        { id: '4-1', name: '提前网购寄到兰州酒店', checked: false }
      ]
    },
    {
      id: '5',
      name: '摄影设备',
      items: [
        { id: '5-1', name: '无人机（租赁）', checked: false },
        { id: '5-2', name: '大疆Pocket3全能套装（租赁）', checked: false },
        { id: '5-3', name: 'A7C2、镜头（24-70、70-200租赁）三脚架、手机、闪光灯、反光板、补光灯', checked: false },
        { id: '5-4', name: '存储卡、读卡器、电池、电池充电器、清洁套装', checked: false }
      ]
    },
    {
      id: '6',
      name: '导航',
      items: [
        { id: '6-1', name: '提前下载好离线地图', checked: false }
      ]
    },
    {
      id: '7',
      name: '紧急联系方式',
      items: [
        { id: '7-1', name: '救援电话：12328（国道G215），122（道路交通报警）', checked: false }
      ]
    },
    {
      id: '8',
      name: '关于高反',
      items: [
        { id: '8-1', name: '青海部分区域尽量避免洗头洗澡，不剧烈运动，氧气瓶及时使用', checked: false }
      ]
    },
    {
      id: '9',
      name: '关于天气',
      items: [
        { id: '9-1', name: '非常干燥，36瓶矿泉水刚好够用！', checked: false },
        { id: '9-2', name: '西方向下午开车特别晒，墨镜必带！', checked: false }
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

  const tipsModule = await prisma.guideModules.create({
    data: {
      guide_id: guide.id,
      name: '无人机攻略',
      template: 'tips',
      sort: 4,
    }
  })

  const tipsData = [
    { id: '1', title: '日月山', content: '随意飞', type: 'info' },
    { id: '2', title: '翡翠湖', content: '随意飞，有人说有干扰，但我飞了3块电池，都没有干扰，不过我最高只飞了100米', type: 'info' },
    { id: '3', title: '茶卡盐湖', content: '随意飞，但是里面人超多，建议走里面一点再飞', type: 'info' },
    { id: '4', title: '察尔汗盐湖', content: '在景区里面有登记点，也会有大喇叭提醒你去登记，填表登记好了，就可以飞了', type: 'info' },
    { id: '5', title: '水上雅丹', content: '因为有滑翔机项目，景区禁飞！但花600坐越野车，进到雅丹之眼那边，司机小哥说可以飞，但其实时不时还是有滑翔机飞过，也有不少海鸥，我觉得飞行有点危险，看情况慎飞吧', type: 'warning' },
    { id: '6', title: '东台吉乃尔湖', content: '随意飞，也是个免费景点，没人管的', type: 'info' },
    { id: '7', title: '沿途雅丹地貌', content: '随意飞，挺出片的，就是小心有些地方有电线或者光缆，要避开', type: 'info' },
    { id: '8', title: '黑独山', content: '免费景点，随便飞，但风挺大的', type: 'info' },
    { id: '9', title: '鸣沙山', content: '禁飞！人多，也有飞行项目。但如果你晚上在山另一边的那种营地露营，那边私人承包的是可以飞的', type: 'warning' },
    { id: '10', title: '七彩丹霞', content: '禁飞！因为热气球，飞机等项目', type: 'warning' },
    { id: '11', title: '祁连山', content: '随意飞', type: 'info' }
  ]

  await prisma.guideModuleContents.create({
    data: {
      module_id: tipsModule.id,
      type: 'module_data',
      content: tipsData
    }
  })
  console.log('提示模块创建成功')

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
      date: '3.29',
      title: '第一天：兰州',
      location: '禄口机场 => 中川机场 => 兰州西站 => 甘肃省博物馆 => 黄河母亲雕像 => 白塔山公园 => 正宁路夜市',
      description: '甘肃省博物馆需提前预约，建议在出发前通过官网或App预约。参观"马家窑文化""丝绸之路"等展厅，了解甘肃的历史文化。正宁路夜市品尝兰州特色小吃：灰豆子、甜醅子、羊肉泡馍、牛奶鸡蛋醪糟等。',
      tips: '住宿：汉庭兰州中心省博物馆店',
      highlights: ['甘肃省博物馆', '黄河母亲雕像', '白塔山公园', '正宁路夜市']
    },
    {
      id: '2',
      date: '3.30',
      title: '第二天：日月山',
      location: '酒店 => 日月山 => 青海湖 => 德令哈',
      description: '导航到日月山景区，到达后在路标拍照，在经幡的地方拍照，抱着小羊拍照(15两个人)，骑着牦牛拍照(10单人)。青海湖二郎剑景区可以不用买门票，在小红书搜一下野路到湖边。',
      tips: '住宿：7天优品德令哈巴音河店',
      highlights: ['日月山', '青海湖', '德令哈']
    },
    {
      id: '3',
      date: '3.31',
      title: '第三天：大柴旦',
      location: '德令哈 => 小柴旦湖 => 大柴旦镇',
      description: '设置途径点小柴旦湖，可以顺路看一眼。茶卡盐湖很看天气，阴天很一般，跳过了茶卡盐湖，到大柴旦了。',
      tips: '住宿：希岸酒店海西大柴旦店\n晚餐：顶顶牛特色干锅牛肉',
      highlights: ['小柴旦湖', '大柴旦镇']
    },
    {
      id: '4',
      date: '4.1',
      title: '第四天：翡翠湖+察尔汗盐湖',
      location: '大柴旦镇 => 大柴旦翡翠湖 => 察尔汗盐湖 => 大柴旦镇',
      description: '大柴旦翡翠湖门票+小火车，在景区入口乘坐小火车，直达终点站，下车就是一个很漂亮的蓝色的湖，人很多，其实不用在那挤着，里面的湖每个颜色都不一样，都很好看。察尔汗盐湖到景区停车场后，乘坐景区大巴车进入景区，大巴要开30分钟到景区，要注意景区出来的末班车是19:00，要控制好时间。',
      tips: '住宿：希岸酒店海西大柴旦店（第二晚）\n午餐：伊布拉特色炕锅开锅涮',
      highlights: ['大柴旦翡翠湖', '察尔汗盐湖']
    },
    {
      id: '5',
      date: '4.2',
      title: '第五天：水上雅丹',
      location: '大柴旦 => 大地之血 => U型公路 => 水上雅丹 => 冷湖镇',
      description: '航拍大地之血。U型公路车多的情况下不要去路中间拍照，全是大货车很危险，用长焦镜头拍摄可以拍出U型公路的压缩感(300mm)。水上雅丹门票+观光车，到达观光车最后一站后寻找雅丹之眼。走国道全长300公里，开3个小时，没信号，一定要安排好时间，避免走夜路！',
      tips: '住宿：茫崖星际品质宾馆\n午餐：水上雅丹德克士\n晚餐：冷湖镇星客来酒家',
      highlights: ['大地之血', 'U型公路', '水上雅丹', '雅丹之眼']
    },
    {
      id: '6',
      date: '4.3',
      title: '第六天：敦煌',
      location: '冷湖镇 => 黑独山 => 苏干湖 => 阿克塞石油小镇 => 敦煌',
      description: '黑独山25.4.3去的时候去黑独山腹地的路被封了修路了，5.1才重新开放，我们就是在观景平台走进去拍了一下没进去腹地很遗憾！阿克塞石油小镇可以直接略过这里，没什么好玩的。',
      tips: '住宿：敦煌\n晚餐：驴爸爸敦煌菜，杏皮茶好喝！',
      highlights: ['黑独山', '阿克塞石油小镇', '敦煌']
    },
    {
      id: '7',
      date: '4.4',
      title: '第七天：莫高窟',
      location: '敦煌 => 敦煌莫高窟 => 嘉峪关 => 张掖',
      description: '提前在网上预订好莫高窟的门票，按照预约时间前往参观。参观莫高窟可以深入了解敦煌的佛教艺术和历史文化，跟随讲解员领略壁画和佛像的魅力，感受千年文化的沉淀，预计参观时间3-4小时。嘉峪关到这的时候已经关门了，导航到蒋家庄，有个土坡可以爬上去用长焦和无人机航拍了一下。',
      tips: '住宿：汉庭张掖大佛寺店\n早餐：筷上瘾牛肉面\n晚餐：王掌柜木桶鱼',
      highlights: ['莫高窟', '嘉峪关']
    },
    {
      id: '8',
      date: '4.5',
      title: '第八天：七彩丹霞',
      location: '张掖(七彩丹霞) => 兰州(结束)',
      description: '七彩丹霞有四个站点，最后一个站点最好看(虹霞台)，天气好嘎嘎出片，拍完找北门大巴直接坐车出来就行了。',
      tips: '住宿：兰州机场君江酒店\n午餐：苏尼特水煮羊\n晚餐：KFC',
      highlights: ['七彩丹霞']
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

  console.log('\n✅ 西北攻略上传完成！')
  console.log('攻略ID:', guide.id)
  console.log('前台访问地址: http://localhost:3000/guides/' + guide.id)
  console.log('后台编辑地址: http://localhost:3000/admin/guides/' + guide.id + '/edit')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
