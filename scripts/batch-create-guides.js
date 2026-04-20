const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:756357wx.@1.15.172.217:5432/xphotos?schema=public&client_encoding=utf8'
    },
  },
})

const guidesData = [
  {
    title: '青岛四天三晚旅游攻略',
    country: '中国',
    city: '青岛',
    days: 4,
    start_date: new Date('2024-04-03'),
    end_date: new Date('2024-04-06'),
    show: 1,
    sort: 1,
    modules: [
      {
        name: '行程时间与交通',
        template: 'transport',
        data: [
          { id: '1', type: 'train', route: '南京南-青岛北', trainNo: 'D2897', company: '高铁', date: '4月3日(三)', time: '18:21-22:29', price: 354, notes: '买不到票买的安庆-青岛北' },
          { id: '2', type: 'train', route: '青岛北-南京南', trainNo: 'D3187', company: '高铁', date: '4月6日(六)', time: '13:21-17:57', price: 259, notes: '' },
        ]
      },
      {
        name: '行前准备',
        template: 'checklist',
        data: [
          {
            id: '1',
            name: '证件',
            icon: '🪪',
            items: [
              { id: '1-1', name: '身份证！身份证！身份证！', checked: true },
            ]
          },
          {
            id: '2',
            name: '衣物',
            icon: '👕',
            items: [
              { id: '2-1', name: '衣物、洗漱品、舒适的鞋子等出行用品', checked: true },
            ]
          },
          {
            id: '3',
            name: '电子设备',
            icon: '📱',
            items: [
              { id: '3-1', name: '手机充电器、充电宝', checked: true },
              { id: '3-2', name: '手表充电器', checked: true },
              { id: '3-3', name: '墨镜', checked: true },
              { id: '3-4', name: '相机电池充电器、相机、镜头、内存卡、读卡器等', checked: true },
            ]
          },
        ]
      },
      {
        name: '行程安排',
        template: 'itinerary',
        data: [
          { id: '1', day: 1, time: '23:35', location: '酒店入住', description: '到达酒店，办理入住，睡一觉调整状态', tips: '如家旗下-青岛台东步行街睿柏·云酒店', type: '住宿' },
          { id: '2', day: 2, time: '07:30', location: '酒店出发', description: '酒店用完早餐，大堂出发', tips: '', type: '出发' },
          { id: '3', day: 2, time: '08:00', location: '栈桥', description: '栈桥景区拍摄', tips: 'PlanA:打车15-18min 12元左右', type: '景点' },
          { id: '4', day: 2, time: '09:30', location: '圣弥厄尔大教堂', description: '栈桥步行1公里20min左右', tips: '拍摄样片参考', type: '景点' },
          { id: '5', day: 2, time: '10:30', location: '德国监狱旧址', description: '机位：马路对面，不用进去了，在外面拍一张', tips: '', type: '景点' },
          { id: '6', day: 2, time: '11:00', location: 'Citywalk', description: '德国监狱旧址-ONE CUP好喝专门店-龙江路-大学路-福山支路', tips: '不舍昼夜咖啡馆、大学路鱼山路交界青岛网红墙', type: '景点' },
          { id: '7', day: 2, time: '13:00', location: '小鱼山', description: '5min可以上去，俯瞰第一海水浴场', tips: '', type: '景点' },
          { id: '8', day: 2, time: '14:00', location: '琴屿路', description: 'S弯拍摄、海边院子里的树', tips: '引导线构图、虚实结合拍摄', type: '景点' },
          { id: '9', day: 2, time: '15:30', location: '小青岛公园', description: '贝壳椅拍照', tips: '可快速刷一下，没有第二海水浴场出片', type: '景点' },
          { id: '10', day: 2, time: '18:00', location: '台东步行街', description: '推荐吃三角猫与三角烧、脆皮猪蹄、大肉肠、仙豆糕', tips: '基本上没有踩雷的', type: '餐饮' },
          { id: '11', day: 3, time: '08:00', location: '青岛雕塑园', description: '人少，适合拍照', tips: '', type: '景点' },
          { id: '12', day: 3, time: '10:00', location: '小麦岛', description: '建议下午四点左右去，上午逆光', tips: '', type: '景点' },
          { id: '13', day: 3, time: '14:00', location: '第二海水浴场', description: '蝴蝶洞口、大洞口、石头桥', tips: '可以拍蓝调，带个灯和玫瑰花道具', type: '景点' },
          { id: '14', day: 3, time: '18:40', location: '第三海水浴场', description: '观看浮山湾灯光秀', tips: '9月1日至次年4月15日18:40-20:00启闭', type: '景点' },
          { id: '15', day: 4, time: '09:00', location: '青岛啤酒博物馆', description: '参观青岛啤酒博物馆', tips: '', type: '景点' },
          { id: '16', day: 4, time: '13:00', location: '返程', description: '青岛北-南京南 D3187 13:21-17:57', tips: '13:00需要进站', type: '交通' },
        ]
      },
      {
        name: '费用清单',
        template: 'expense',
        data: [
          { id: '1', name: '南京-青岛高铁', detail: 'D2897 18:21-22:29', type: '高铁', channel: '12306', unitPrice: 354, subtotal: 354, category: 'transport', notes: '买不到票买的安庆-青岛北' },
          { id: '2', name: '青岛-南京高铁', detail: 'D3187 13:21-17:57', type: '高铁', channel: '12306', unitPrice: 259, subtotal: 259, category: 'transport', notes: '' },
          { id: '3', name: '如家睿柏·云酒店', detail: '4.3-4.6 三晚', type: '住宿', channel: '美团', unitPrice: 400, subtotal: 400, category: 'accommodation', notes: '青岛台东步行街店' },
          { id: '4', name: '餐饮', detail: '四天餐饮', type: '餐饮', channel: '现场', unitPrice: 300, subtotal: 300, category: 'food', notes: '台东步行街小吃等' },
          { id: '5', name: '交通', detail: '市内打车地铁', type: '交通', channel: '高德', unitPrice: 100, subtotal: 100, category: 'transport', notes: '' },
        ]
      },
    ]
  },
  {
    title: '三清山周末特种兵攻略',
    country: '中国',
    city: '上饶',
    days: 2,
    start_date: new Date('2024-08-23'),
    end_date: new Date('2024-08-24'),
    show: 1,
    sort: 2,
    modules: [
      {
        name: '交通安排',
        template: 'transport',
        data: [
          { id: '1', type: 'train', route: '南京南站-黄山北站', trainNo: 'G3027', company: '高铁', date: '8月23日', time: '6:58-9:00', price: 148, notes: '' },
          { id: '2', type: 'train', route: '黄山北站-上饶站', trainNo: 'G3027', company: '高铁', date: '8月23日', time: '9:04-9:51', price: 74.5, notes: '去程总：222.5' },
          { id: '3', type: 'train', route: '上饶站-黄山北站', trainNo: 'G2760', company: '高铁', date: '8月24日', time: '10:34-11:16', price: 74.5, notes: '' },
          { id: '4', type: 'train', route: '黄山北站-南京南站', trainNo: 'G2760', company: '高铁', date: '8月24日', time: '11:19-13:03', price: 154, notes: '返程总：228.5' },
        ]
      },
      {
        name: '费用清单',
        template: 'expense',
        data: [
          { id: '1', name: '南京-上饶高铁', detail: 'G3027 去程', type: '高铁', channel: '12306', unitPrice: 222.5, subtotal: 222.5, category: 'transport', notes: '' },
          { id: '2', name: '上饶站-金沙索道', detail: '大巴', type: '大巴', channel: '现场', unitPrice: 47, subtotal: 47, category: 'transport', notes: '' },
          { id: '3', name: '上饶-南京高铁', detail: 'G2760 返程', type: '高铁', channel: '12306', unitPrice: 228.5, subtotal: 228.5, category: 'transport', notes: '' },
          { id: '4', name: '外双溪索道-上饶站', detail: '大巴', type: '大巴', channel: '现场', unitPrice: 32, subtotal: 32, category: 'transport', notes: '' },
          { id: '5', name: '三清山门票+索道', detail: '联票', type: '门票', channel: '美团', unitPrice: 239, subtotal: 239, category: 'ticket', notes: '门票+上下索道' },
          { id: '6', name: '无人机租赁', detail: 'DJI Mini4 pro', type: '租赁', channel: '人人租', unitPrice: 152, subtotal: 152, category: 'equipment', notes: '' },
          { id: '7', name: '住宿', detail: '露宿山头', type: '住宿', channel: '-', unitPrice: 0, subtotal: 0, category: 'accommodation', notes: '' },
          { id: '8', name: '8.23午饭', detail: '兰州拉面', type: '午餐', channel: '现场', unitPrice: 32, subtotal: 32, category: 'food', notes: '' },
          { id: '9', name: '8.24早饭', detail: '江西炒粉', type: '早餐', channel: '现场', unitPrice: 18, subtotal: 18, category: 'food', notes: '' },
          { id: '10', name: '景区消费', detail: '黄瓜+烤肠', type: '零食', channel: '现场', unitPrice: 20, subtotal: 20, category: 'food', notes: '' },
        ]
      },
      {
        name: '徒步路线',
        template: 'itinerary',
        data: [
          { id: '1', day: 1, time: '09:51', location: '上饶站', description: '到达上饶站，转大巴前往金沙索道', tips: '', type: '交通' },
          { id: '2', day: 1, time: '11:00', location: '金沙索道', description: '乘坐索道上山', tips: '', type: '景点' },
          { id: '3', day: 1, time: '12:00', location: '巨蟒出峰', description: '游览巨蟒出峰', tips: '', type: '景点' },
          { id: '4', day: 1, time: '14:00', location: '禹皇顶', description: '登禹皇顶', tips: '', type: '景点' },
          { id: '5', day: 1, time: '15:30', location: '玉台', description: '游览玉台', tips: '', type: '景点' },
          { id: '6', day: 1, time: '17:00', location: '阳光海岸', description: '前往阳光海岸', tips: '', type: '景点' },
          { id: '7', day: 1, time: '18:30', location: '紫烟石', description: '拍日落和蓝调银河地景', tips: '最佳日落拍摄点', type: '摄影' },
          { id: '8', day: 1, time: '20:00', location: '猴王观宝附近', description: '拍银河', tips: '', type: '摄影' },
          { id: '9', day: 2, time: '05:00', location: '阳光海岸', description: '拍日出', tips: '五老朝圣东北那颗松树机位', type: '摄影' },
          { id: '10', day: 2, time: '08:00', location: '外双溪索道', description: '下山', tips: '', type: '景点' },
          { id: '11', day: 2, time: '10:34', location: '上饶站', description: '返程', tips: 'G2760 上饶站-黄山北站', type: '交通' },
        ]
      },
    ]
  },
  {
    title: '威海冬至三天两晚攻略',
    country: '中国',
    city: '威海',
    days: 3,
    start_date: new Date('2024-12-20'),
    end_date: new Date('2024-12-22'),
    show: 1,
    sort: 3,
    modules: [
      {
        name: '交通安排',
        template: 'transport',
        data: [
          { id: '1', type: 'flight', route: '禄口机场-大水泊机场', flightNo: '9C8744', company: '春秋航空', date: '12月20日', time: '20:05-21:35', price: 403, notes: '含往返保障' },
          { id: '2', type: 'flight', route: '大水泊机场-禄口机场', flightNo: '9C8743', company: '春秋航空', date: '12月22日', time: '16:35-18:20', price: 403, notes: '含往返保障' },
        ]
      },
      {
        name: '费用清单',
        template: 'expense',
        data: [
          { id: '1', name: '机票来回', detail: '含往返无忧', type: '飞机', channel: '春秋航空', unitPrice: 740, subtotal: 740, category: 'transport', notes: '370*2' },
          { id: '2', name: '顺丰快递行李', detail: '', type: '快递', channel: '顺丰', unitPrice: 104, subtotal: 104, category: 'other', notes: '' },
          { id: '3', name: '租车', detail: '本田思域', type: '租车', channel: '一嗨租车', unitPrice: 220, subtotal: 220, category: 'transport', notes: '440/2' },
          { id: '4', name: '油费', detail: '', type: '加油', channel: '加油站', unitPrice: 71, subtotal: 71, category: 'transport', notes: '142/2' },
          { id: '5', name: '租无人机', detail: 'Mini4pro', type: '租赁', channel: '惠租', unitPrice: 200, subtotal: 200, category: 'equipment', notes: '' },
          { id: '6', name: 'Day1住宿', detail: '智尚公寓酒店', type: '住宿', channel: '美团', unitPrice: 56, subtotal: 56, category: 'accommodation', notes: '112/2' },
          { id: '7', name: 'Day2住宿', detail: '小仙女夏夏的民宿', type: '住宿', channel: '美团', unitPrice: 82, subtotal: 82, category: 'accommodation', notes: '164/2' },
          { id: '8', name: '火锅', detail: '', type: '餐饮', channel: '现场', unitPrice: 111, subtotal: 111, category: 'food', notes: '222/2' },
          { id: '9', name: '烧烤', detail: '', type: '餐饮', channel: '现场', unitPrice: 88, subtotal: 88, category: 'food', notes: '176/2' },
          { id: '10', name: '炒菜', detail: '', type: '餐饮', channel: '现场', unitPrice: 71, subtotal: 71, category: 'food', notes: '142/2' },
          { id: '11', name: '早饭', detail: '', type: '餐饮', channel: '现场', unitPrice: 35, subtotal: 35, category: 'food', notes: '70/2' },
        ]
      },
      {
        name: '行前准备',
        template: 'checklist',
        data: [
          {
            id: '1',
            name: '证件',
            icon: '🪪',
            items: [
              { id: '1-1', name: '身份证', checked: false },
              { id: '1-2', name: '驾照', checked: false },
            ]
          },
          {
            id: '2',
            name: '衣物',
            icon: '👕',
            items: [
              { id: '2-1', name: '口罩', checked: false },
              { id: '2-2', name: '墨镜', checked: false },
              { id: '2-3', name: '冲锋衣', checked: false },
              { id: '2-4', name: '羽绒服', checked: false },
              { id: '2-5', name: '大衣', checked: false },
              { id: '2-6', name: '运动鞋', checked: false },
            ]
          },
          {
            id: '3',
            name: '摄影设备',
            icon: '📷',
            items: [
              { id: '3-1', name: '相机（索尼A7C2）', checked: false },
              { id: '3-2', name: '镜头（适马 24-70 F2.8）', checked: false },
              { id: '3-3', name: '三脚架', checked: false },
              { id: '3-4', name: '无人机套装', checked: false },
              { id: '3-5', name: '内存卡', checked: false },
              { id: '3-6', name: '读卡器*2', checked: false },
              { id: '3-7', name: '电池*2', checked: false },
              { id: '3-8', name: '电池充电盒', checked: false },
              { id: '3-9', name: '手机数据线、手表数据线、充电宝10000mA*2', checked: false },
              { id: '3-10', name: '插座', checked: false },
              { id: '3-11', name: '充电头', checked: false },
            ]
          },
        ]
      },
      {
        name: '行程安排',
        template: 'itinerary',
        data: [
          { id: '1', day: 1, time: '21:35', location: '大水泊机场', description: '到达威海机场，取车', tips: '一嗨租车门店', type: '交通' },
          { id: '2', day: 1, time: '22:30', location: '智尚公寓酒店', description: '入住酒店', tips: '天鹅湖附近，方便第二天日出拍摄', type: '住宿' },
          { id: '3', day: 2, time: '06:00', location: '车祝沟村天鹅湖', description: '拍日出S弯，天鹅湖晨雾', tips: '最佳日出拍摄点', type: '摄影' },
          { id: '4', day: 2, time: '09:00', location: '布鲁威斯沉船景区', description: '拍延时风光，人像背影', tips: '', type: '摄影' },
          { id: '5', day: 2, time: '14:00', location: '鸡鸣岛', description: '孤独礼堂航拍', tips: '有雪更出片', type: '摄影' },
          { id: '6', day: 2, time: '16:00', location: '那香海', description: '沿海边拍照可以拍到风车', tips: '可选看时间', type: '景点' },
          { id: '7', day: 2, time: '18:00', location: '殴乐坊', description: '吃饭', tips: '', type: '餐饮' },
          { id: '8', day: 2, time: '20:00', location: '小仙女夏夏的民宿', description: '入住民宿', tips: '国际海水浴场附近', type: '住宿' },
          { id: '9', day: 3, time: '06:00', location: '海水浴场', description: '日出拍摄（下雪可去）', tips: '', type: '摄影' },
          { id: '10', day: 3, time: '08:00', location: '金海湾栈桥', description: '栈桥拍摄', tips: '', type: '景点' },
          { id: '11', day: 3, time: '09:30', location: '远遥码头', description: '码头拍摄', tips: '', type: '景点' },
          { id: '12', day: 3, time: '11:00', location: '华工纪念馆', description: '航拍', tips: '', type: '摄影' },
          { id: '13', day: 3, time: '14:00', location: '大水泊机场', description: '还车，返程', tips: '9C8743 16:35-18:20', type: '交通' },
        ]
      },
    ]
  },
  {
    title: '武功山周末特种兵攻略',
    country: '中国',
    city: '萍乡',
    days: 3,
    start_date: new Date('2024-08-09'),
    end_date: new Date('2024-08-11'),
    show: 1,
    sort: 4,
    modules: [
      {
        name: '交通安排',
        template: 'transport',
        data: [
          { id: '1', type: 'train', route: '南京南-南昌西', trainNo: 'D3197', company: '高铁', date: '8月9日', time: '19:25-23:03', price: 199, notes: '7月26日 8:00抢票' },
          { id: '2', type: 'train', route: '南昌西-萍乡北', trainNo: 'D3197', company: '高铁', date: '8月10日', time: '9:05-10:21', price: 109, notes: '7月27日 9:30抢票' },
          { id: '3', type: 'train', route: '萍乡北-南昌西', trainNo: 'G1378', company: '高铁', date: '8月11日', time: '14:29-15:48', price: 109, notes: '7月28日 9:00抢票' },
          { id: '4', type: 'train', route: '南昌西-南京南', trainNo: 'G2786', company: '高铁', date: '8月11日', time: '17:34-21:02', price: 236, notes: '7月28日 9:30抢票' },
        ]
      },
      {
        name: '行前准备',
        template: 'checklist',
        data: [
          {
            id: '1',
            name: '证件',
            icon: '🪪',
            items: [
              { id: '1-1', name: '身份证！身份证！身份证！', checked: false },
            ]
          },
          {
            id: '2',
            name: '衣物',
            icon: '👕',
            items: [
              { id: '2-1', name: '衣物、冲锋衣(带内胆!!!)', checked: false },
              { id: '2-2', name: '登山帽、墨镜、手套、口罩', checked: false },
              { id: '2-3', name: '鞋子(舒服的运动鞋，鞋底要防滑)', checked: false },
              { id: '2-4', name: '背包(够装就行,轻装上阵)', checked: false },
            ]
          },
          {
            id: '3',
            name: '食物',
            icon: '🍉',
            items: [
              { id: '3-1', name: '泡面/自热火锅', checked: false },
              { id: '3-2', name: '矿泉水、能量水', checked: false },
              { id: '3-3', name: '干粮零食(小面包饼干巧克力糖果辣条…)', checked: false },
              { id: '3-4', name: '水分充足的水果(黄瓜、橘子)', checked: false },
            ]
          },
          {
            id: '4',
            name: '设备',
            icon: '📷',
            items: [
              { id: '4-1', name: '相机（电池、存储卡、读卡器）', checked: false },
              { id: '4-2', name: '数据线', checked: false },
              { id: '4-3', name: '支架', checked: false },
              { id: '4-4', name: '充电宝✘2', checked: false },
            ]
          },
          {
            id: '5',
            name: '其他',
            icon: '🎒',
            items: [
              { id: '5-1', name: '一次性四件套', checked: false },
              { id: '5-2', name: '手电简', checked: false },
              { id: '5-3', name: '登山棍(山脚下2块钱一根)', checked: false },
              { id: '5-4', name: '驱蚊水', checked: false },
              { id: '5-5', name: '保温杯', checked: false },
              { id: '5-6', name: '卫生纸', checked: false },
              { id: '5-7', name: '垃圾袋', checked: false },
            ]
          },
        ]
      },
      {
        name: '行程安排',
        template: 'itinerary',
        data: [
          { id: '1', day: 1, time: '23:03', location: '南昌西站', description: '到达南昌西站，前往酒店入住', tips: '距离1.1km', type: '住宿' },
          { id: '2', day: 1, time: '23:30', location: '书美·漫旅精选酒店', description: '入住双床房', tips: '¥103', type: '住宿' },
          { id: '3', day: 2, time: '08:30', location: '酒店出发', description: '酒店用完早餐，下楼', tips: '', type: '出发' },
          { id: '4', day: 2, time: '09:05', location: '南昌西-萍乡北', description: '高铁 D3197', tips: '9:05-10:21', type: '交通' },
          { id: '5', day: 2, time: '10:30', location: '萍乡北站', description: '车站大巴前往武功山', tips: '￥27/r 1小时20分钟', type: '交通' },
          { id: '6', day: 2, time: '12:00', location: '游客服务中心', description: '到达游客服务中心，吃午饭', tips: '门票￥70/r', type: '餐饮' },
          { id: '7', day: 2, time: '13:00', location: '武功山大门', description: '乘坐转运车到达山脚下', tips: '一级索道+徒步', type: '景点' },
          { id: '8', day: 2, time: '13:30', location: '一级索道', description: '乘坐一级索道到紫极宫', tips: '￥65/r', type: '景点' },
          { id: '9', day: 2, time: '14:30', location: '徒步上山', description: '走中间路线徒步上山', tips: '17:00到山顶看日落', type: '景点' },
          { id: '10', day: 2, time: '17:00', location: '金顶', description: '观看日落，视天气情况拍星空', tips: '', type: '景点' },
          { id: '11', day: 2, time: '晚上', location: '金顶客栈', description: '入住星空大床房', tips: '￥578', type: '住宿' },
          { id: '12', day: 3, time: '05:00', location: '日出观景', description: '日出时间要看APP提前一小时去占位置', tips: '', type: '景点' },
          { id: '13', day: 3, time: '07:00', location: '步行下山', description: '收拾收拾步行下山', tips: '', type: '景点' },
          { id: '14', day: 3, time: '12:00', location: '摆渡车', description: '乘坐摆渡车或包车到萍乡北', tips: '￥30/r', type: '交通' },
          { id: '15', day: 3, time: '14:29', location: '萍乡北-南昌西', description: '高铁 G1378', tips: '14:29-15:48', type: '交通' },
          { id: '16', day: 3, time: '17:34', location: '南昌西-南京南', description: '高铁 G2786', tips: '17:34-21:02', type: '交通' },
        ]
      },
      {
        name: '费用清单',
        template: 'expense',
        data: [
          { id: '1', name: '南京南-南昌西', detail: 'D3197 19:25-23:03', type: '高铁', channel: '12306', unitPrice: 199, subtotal: 199, category: 'transport', notes: '' },
          { id: '2', name: '南昌西-萍乡北', detail: 'D3197 9:05-10:21', type: '高铁', channel: '12306', unitPrice: 109, subtotal: 109, category: 'transport', notes: '' },
          { id: '3', name: '萍乡北-南昌西', detail: 'G1378 14:29-15:48', type: '高铁', channel: '12306', unitPrice: 109, subtotal: 109, category: 'transport', notes: '' },
          { id: '4', name: '南昌西-南京南', detail: 'G2786 17:34-21:02', type: '高铁', channel: '12306', unitPrice: 236, subtotal: 236, category: 'transport', notes: '' },
          { id: '5', name: '摆渡车/包车', detail: '去程+返程', type: '大巴', channel: '现场', unitPrice: 60, subtotal: 60, category: 'transport', notes: '30*2' },
          { id: '6', name: '南昌西站住宿', detail: '书美·漫旅精选酒店', type: '住宿', channel: '美团', unitPrice: 52, subtotal: 52, category: 'accommodation', notes: '103/2' },
          { id: '7', name: '武功山顶住宿', detail: '金顶客栈星空大床房', type: '住宿', channel: '美团', unitPrice: 289, subtotal: 289, category: 'accommodation', notes: '578/2' },
          { id: '8', name: '景区门票', detail: '武功山门票', type: '门票', channel: '现场', unitPrice: 70, subtotal: 70, category: 'ticket', notes: '' },
          { id: '9', name: '上行一级缆车', detail: '', type: '缆车', channel: '现场', unitPrice: 65, subtotal: 65, category: 'ticket', notes: '' },
          { id: '10', name: '餐饮', detail: '大概', type: '餐饮', channel: '现场', unitPrice: 150, subtotal: 150, category: 'food', notes: '' },
        ]
      },
    ]
  },
  {
    title: '周末长白山特种兵攻略',
    country: '中国',
    city: '长白山',
    days: 3,
    start_date: new Date('2024-12-26'),
    end_date: new Date('2024-12-28'),
    show: 1,
    sort: 5,
    modules: [
      {
        name: '交通安排',
        template: 'transport',
        data: [
          { id: '1', type: 'flight', route: '南京禄口-沈阳桃仙', flightNo: 'ZH9704', company: '深航', date: '12月26日', time: '20:15-22:30', price: 450, notes: '' },
          { id: '2', type: 'train', route: '沈阳北-长白山', trainNo: 'G8135', company: '高铁', date: '12月27日', time: '9:25-11:43', price: 173, notes: '' },
          { id: '3', type: 'train', route: '长白山-沈阳', trainNo: 'G3554', company: '高铁', date: '12月28日', time: '12:21-14:25', price: 275, notes: '' },
          { id: '4', type: 'flight', route: '沈阳桃仙-徐州观音', flightNo: 'MU9780', company: '东航', date: '12月28日', time: '18:55-21:05', price: 690, notes: '' },
        ]
      },
      {
        name: '费用清单',
        template: 'expense',
        data: [
          { id: '1', name: '南京-沈阳飞机', detail: 'ZH9704 20:15-22:30', type: '飞机', channel: '携程', unitPrice: 450, subtotal: 450, category: 'transport', notes: '' },
          { id: '2', name: '沈阳-徐州飞机', detail: 'MU9780 18:55-21:05', type: '飞机', channel: '携程', unitPrice: 690, subtotal: 690, category: 'transport', notes: '' },
          { id: '3', name: '沈阳北-长白山高铁', detail: 'G8135 9:25-11:43', type: '高铁', channel: '12306', unitPrice: 173, subtotal: 173, category: 'transport', notes: '' },
          { id: '4', name: '长白山-沈阳北高铁', detail: 'G3554 12:21-14:25', type: '高铁', channel: '12306', unitPrice: 173, subtotal: 173, category: 'transport', notes: '' },
          { id: '5', name: '沈阳桃仙机场-西塔老街', detail: '打车', type: '打车', channel: '高德', unitPrice: 24.4, subtotal: 24.4, category: 'transport', notes: '73.2/3' },
          { id: '6', name: 'Day1包车', detail: '高铁站-雪岭-二道白河镇-蓝景温泉-二道白河镇', type: '包车', channel: '小红书', unitPrice: 115, subtotal: 115, category: 'transport', notes: '460/4' },
          { id: '7', name: 'Day2包车', detail: '二道白河镇-水色漂流-恩都里-高铁站', type: '包车', channel: '小红书', unitPrice: 25, subtotal: 25, category: 'transport', notes: '100/4' },
          { id: '8', name: '二道白河镇-长白山站', detail: '打车', type: '打车', channel: '饭店老板', unitPrice: 5, subtotal: 5, category: 'transport', notes: '20/4' },
          { id: '9', name: '雪岭门票', detail: '', type: '门票', channel: '包车代买', unitPrice: 80, subtotal: 80, category: 'ticket', notes: '' },
          { id: '10', name: '雪岭摩托', detail: '', type: '娱乐', channel: '现场扫码', unitPrice: 188, subtotal: 188, category: 'ticket', notes: '' },
          { id: '11', name: '雪岭马拉犁耙', detail: '', type: '娱乐', channel: '现场扫码', unitPrice: 120, subtotal: 120, category: 'ticket', notes: '' },
          { id: '12', name: '蓝景温泉', detail: '', type: '温泉', channel: '包车代买', unitPrice: 228, subtotal: 228, category: 'ticket', notes: '' },
          { id: '13', name: '水色漂流', detail: '', type: '漂流', channel: '包车代买', unitPrice: 80, subtotal: 80, category: 'ticket', notes: '' },
          { id: '14', name: '12.26-27住宿', detail: '兰朵高奢定制酒店', type: '住宿', channel: '美团', unitPrice: 140, subtotal: 140, category: 'accommodation', notes: '227.98/2' },
          { id: '15', name: '12.27-28住宿', detail: '艾菲酒店（二道白河镇店）', type: '住宿', channel: '美团', unitPrice: 182, subtotal: 182, category: 'accommodation', notes: '364/2' },
          { id: '16', name: '12.26晚吃饭', detail: '美里·朝鲜族烤串', type: '餐饮', channel: '美团', unitPrice: 83, subtotal: 83, category: 'food', notes: '332/4' },
          { id: '17', name: '12.27晚吃饭', detail: '林海雪缘铁锅炖', type: '餐饮', channel: '美团', unitPrice: 92, subtotal: 92, category: 'food', notes: '372/4' },
          { id: '18', name: '12.28午饭', detail: '凰粮拌饭馆（东北菜）', type: '餐饮', channel: '现场', unitPrice: 39.75, subtotal: 39.75, category: 'food', notes: '159/4' },
          { id: '19', name: '12.28晚饭', detail: '机场晚饭', type: '餐饮', channel: '现场', unitPrice: 55, subtotal: 55, category: 'food', notes: '' },
          { id: '20', name: '沈阳按摩', detail: '', type: '休闲', channel: '美团', unitPrice: 243, subtotal: 243, category: 'other', notes: '' },
          { id: '21', name: '准备装备', detail: '', type: '购物', channel: '', unitPrice: 176.22, subtotal: 176.22, category: 'shopping', notes: '' },
        ]
      },
      {
        name: '行程安排',
        template: 'itinerary',
        data: [
          { id: '1', day: 1, time: '20:15', location: '禄口机场', description: '深航 ZH9704 南京禄口-沈阳桃仙', tips: '20:15-22:30', type: '交通' },
          { id: '2', day: 1, time: '22:30', location: '沈阳桃仙机场', description: '打车到沈阳北站附近', tips: '', type: '交通' },
          { id: '3', day: 1, time: '23:30', location: '西塔老街', description: '吃饭：美里·朝鲜族烤串', tips: '', type: '餐饮' },
          { id: '4', day: 1, time: '晚上', location: '兰朵高奢定制酒店', description: '住宿', tips: '沈阳北附近', type: '住宿' },
          { id: '5', day: 2, time: '09:25', location: '沈阳北站', description: '高铁 G8135 沈阳北=>长白山', tips: '9:25-11:43', type: '交通' },
          { id: '6', day: 2, time: '11:50', location: '长白山西', description: '到达长白山西站', tips: '', type: '交通' },
          { id: '7', day: 2, time: '12:00', location: '前往雪岭', description: '包车前往雪岭，大概一小时到达', tips: '', type: '交通' },
          { id: '8', day: 2, time: '13:10', location: '雪岭', description: '雪岭游玩：雪地摩托上山、雪地拍照、马拉犁耙下山', tips: '日落后立马去马拉犁耙排队下山', type: '景点' },
          { id: '9', day: 2, time: '16:30', location: '二道白河镇', description: '雪岭=>二道白河镇，路上联系老板提前炖上', tips: '铁锅炖大鹅-林海雪缘铁锅炖', type: '餐饮' },
          { id: '10', day: 2, time: '19:00', location: '蓝景温泉', description: '天然室外温泉', tips: '要自备泳裤，现场60块钱一条', type: '休闲' },
          { id: '11', day: 2, time: '21:40', location: '艾菲酒店', description: '回二道白河镇入住', tips: '二道白河镇店', type: '住宿' },
          { id: '12', day: 3, time: '05:30', location: '水色漂流', description: '出门前往水色漂流', tips: '6:00-7:10漂流，有晨雾有雾凇，建议早点去', type: '景点' },
          { id: '13', day: 3, time: '07:30', location: '恩都里', description: '打卡云顶天宫、雪王军团', tips: '', type: '景点' },
          { id: '14', day: 3, time: '10:30', location: '二道白河镇', description: '当地东北菜', tips: '锅包肉好吃要吃', type: '餐饮' },
          { id: '15', day: 3, time: '11:50', location: '长白山站', description: '二道白河镇=>长白山站', tips: '', type: '交通' },
          { id: '16', day: 3, time: '12:21', location: '长白山站', description: '高铁 G3554 长白山=>沈阳', tips: '12:21-14:25', type: '交通' },
          { id: '17', day: 3, time: '15:00', location: '沈阳', description: '沈阳按摩', tips: '', type: '休闲' },
          { id: '18', day: 3, time: '16:10', location: '沈阳桃仙机场', description: '沈阳到桃仙机场', tips: '', type: '交通' },
          { id: '19', day: 3, time: '18:55', location: '沈阳桃仙机场', description: '东航 MU9780 沈阳飞回徐州', tips: '18:55-21:05', type: '交通' },
        ]
      },
    ]
  },
  {
    title: '雨崩四天三晚徒步攻略',
    country: '中国',
    city: '迪庆',
    days: 4,
    start_date: new Date('2024-08-28'),
    end_date: new Date('2024-09-01'),
    show: 1,
    sort: 6,
    modules: [
      {
        name: '交通安排',
        template: 'transport',
        data: [
          { id: '1', type: 'flight', route: '南京-丽江', flightNo: '', company: '飞机', date: '8月28日', time: '22:10-01:30', price: 500, notes: '' },
          { id: '2', type: 'flight', route: '丽江-南京', flightNo: 'HO1712', company: '吉祥航空', date: '9月1日', time: '13:55', price: 370, notes: '甩尾' },
          { id: '3', type: 'train', route: '丽江站-香格里拉站', trainNo: '', company: '高铁', date: '8月29日', time: '7:42-9:07', price: 70, notes: '' },
          { id: '4', type: 'train', route: '香格里拉站-丽江站', trainNo: '', company: '高铁', date: '9月1日', time: '9:45-10:58', price: 63, notes: '' },
        ]
      },
      {
        name: '费用清单',
        template: 'expense',
        data: [
          { id: '1', name: '南京-丽江飞机', detail: '', type: '飞机', channel: '携程', unitPrice: 500, subtotal: 500, category: 'transport', notes: '' },
          { id: '2', name: '丽江-南京飞机', detail: '甩尾', type: '飞机', channel: '携程', unitPrice: 370, subtotal: 370, category: 'transport', notes: '' },
          { id: '3', name: '丽江站-香格里拉站', detail: '高铁', type: '高铁', channel: '12306', unitPrice: 70, subtotal: 70, category: 'transport', notes: '' },
          { id: '4', name: '香格里拉站-丽江站', detail: '高铁', type: '高铁', channel: '12306', unitPrice: 63, subtotal: 63, category: 'transport', notes: '' },
          { id: '5', name: '丽江机场-酒店', detail: '打车', type: '打车', channel: '高德', unitPrice: 66.36, subtotal: 66.36, category: 'transport', notes: '' },
          { id: '6', name: '香格里拉站-尼农', detail: '包车', type: '包车', channel: '', unitPrice: 120, subtotal: 120, category: 'transport', notes: '' },
          { id: '7', name: '下雨崩-上雨崩', detail: '皮卡', type: '皮卡', channel: '', unitPrice: 60, subtotal: 60, category: 'transport', notes: '' },
          { id: '8', name: '上雨崩-下雨崩', detail: '皮卡', type: '皮卡', channel: '', unitPrice: 60, subtotal: 60, category: 'transport', notes: '' },
          { id: '9', name: '尼农-香格里拉站', detail: '包车', type: '包车', channel: '', unitPrice: 120, subtotal: 120, category: 'transport', notes: '' },
          { id: '10', name: '丽江站-丽江古城', detail: '打车', type: '打车', channel: '美团', unitPrice: 31.06, subtotal: 31.06, category: 'transport', notes: '' },
          { id: '11', name: '丽江古城-机场大巴', detail: '', type: '大巴', channel: '古城南门', unitPrice: 20, subtotal: 20, category: 'transport', notes: '' },
          { id: '12', name: '雨崩门票', detail: '', type: '门票', channel: '', unitPrice: 55, subtotal: 55, category: 'ticket', notes: '' },
          { id: '13', name: '山脚厕所', detail: '', type: '其他', channel: '', unitPrice: 1, subtotal: 1, category: 'other', notes: '' },
          { id: '14', name: '无人机租赁', detail: '', type: '租赁', channel: '惠租', unitPrice: 240, subtotal: 240, category: 'equipment', notes: '' },
          { id: '15', name: '8.28-29住宿', detail: '尚客优丽江高铁站点', type: '住宿', channel: '高德', unitPrice: 100.18, subtotal: 100.18, category: 'accommodation', notes: '特惠大床房' },
          { id: '16', name: '8.29-30住宿', detail: '德钦雨崩觉色酥油茶客栈', type: '住宿', channel: '携程', unitPrice: 171.45, subtotal: 171.45, category: 'accommodation', notes: '342.9/2 露台星空套房' },
          { id: '17', name: '8.30-31住宿', detail: '雨崩下村慕雪精品酒店', type: '住宿', channel: '智行', unitPrice: 169.5, subtotal: 169.5, category: 'accommodation', notes: '339/2 舒适双床房' },
          { id: '18', name: '8.31-9.1住宿', detail: '花香设计师美宿丽江古城店', type: '住宿', channel: '美团', unitPrice: 101.93, subtotal: 101.93, category: 'accommodation', notes: '特惠房' },
          { id: '19', name: '8.29早饭', detail: '丽江站', type: '餐饮', channel: '', unitPrice: 17, subtotal: 17, category: 'food', notes: '' },
          { id: '20', name: '8.29晚饭', detail: '上雨崩', type: '餐饮', channel: '', unitPrice: 70, subtotal: 70, category: 'food', notes: '210/3' },
          { id: '21', name: '8.30早饭', detail: '上雨崩', type: '餐饮', channel: '', unitPrice: 25, subtotal: 25, category: 'food', notes: '' },
          { id: '22', name: '8.30晚饭', detail: '下雨崩', type: '餐饮', channel: '', unitPrice: 130, subtotal: 130, category: 'food', notes: '390/3' },
          { id: '23', name: '8.31早饭', detail: '下雨崩', type: '餐饮', channel: '', unitPrice: 20, subtotal: 20, category: 'food', notes: '' },
          { id: '24', name: '8.31午饭', detail: '泡面墙', type: '餐饮', channel: '', unitPrice: 30, subtotal: 30, category: 'food', notes: '' },
          { id: '25', name: '8.31晚饭', detail: '丽江古城', type: '餐饮', channel: '', unitPrice: 232, subtotal: 232, category: 'food', notes: '' },
          { id: '26', name: '9.1早饭', detail: '丽江古城', type: '餐饮', channel: '', unitPrice: 38, subtotal: 38, category: 'food', notes: '' },
          { id: '27', name: '补给', detail: '尼农线+冰湖线+神瀑线', type: '补给', channel: '', unitPrice: 58, subtotal: 58, category: 'food', notes: '32+18+8' },
          { id: '28', name: '泡脚', detail: '上雨崩+下雨崩', type: '休闲', channel: '', unitPrice: 60, subtotal: 60, category: 'other', notes: '30+30' },
          { id: '29', name: '丽江足疗按摩', detail: '', type: '休闲', channel: '', unitPrice: 98, subtotal: 98, category: 'other', notes: '' },
          { id: '30', name: '登山杖', detail: '', type: '装备', channel: '', unitPrice: 20, subtotal: 20, category: 'equipment', notes: '' },
          { id: '31', name: '特产', detail: '', type: '购物', channel: '', unitPrice: 103, subtotal: 103, category: 'shopping', notes: '' },
        ]
      },
      {
        name: '行程安排',
        template: 'itinerary',
        data: [
          { id: '1', day: 1, time: '22:10', location: '禄口机场', description: '从禄口机场出发', tips: '', type: '交通' },
          { id: '2', day: 1, time: '01:30', location: '丽江机场', description: '抵达丽江机场，乘机场大巴/打车到丽江站附近酒店', tips: '三义机场不大，0:25发车，0:50到古城南门', type: '交通' },
          { id: '3', day: 1, time: '02:00', location: '尚客优连锁酒店', description: '入住酒店', tips: '丽江高铁站店', type: '住宿' },
          { id: '4', day: 2, time: '06:30', location: '丽江站', description: '起床', tips: '', type: '出发' },
          { id: '5', day: 2, time: '07:42', location: '丽江站-香格里拉站', description: '高铁 7:42-9:07', tips: '车票8.15号开售', type: '交通' },
          { id: '6', day: 2, time: '10:00', location: '香格里拉站', description: '拼车前往尼农', tips: '￥120/r，约4.5小时，联系电话15187269770', type: '交通' },
          { id: '7', day: 2, time: '14:30', location: '尼农', description: '徒步进雨崩上村', tips: '14公里上坡，约4-6小时，门票￥54/r', type: '徒步' },
          { id: '8', day: 2, time: '19:30', location: '雨崩上村', description: '到达雨崩上村', tips: '酥油茶客栈', type: '住宿' },
          { id: '9', day: 3, time: '08:00', location: '雨崩上村', description: '出发冰湖切尼色线', tips: '两步路APP搜"冰湖切尼色"', type: '徒步' },
          { id: '10', day: 3, time: '11:00', location: '冰湖', description: '上雨崩->冰湖，3小时，6.7km', tips: '冰湖海拔3900爬升700米', type: '徒步' },
          { id: '11', day: 3, time: '14:30', location: '尼色', description: '冰湖->尼色，3小时，6.5km', tips: '', type: '徒步' },
          { id: '12', day: 3, time: '18:00', location: '上雨崩', description: '尼色->上雨崩，3小时，5.7km', tips: '尼色到小木屋后可考虑折返', type: '徒步' },
          { id: '13', day: 3, time: '19:00', location: '下雨崩', description: '上雨崩->下雨崩', tips: '雨崩下村慕雪精品酒店', type: '住宿' },
          { id: '14', day: 4, time: '07:30', location: '雨崩下村', description: '出发神瀑线', tips: '', type: '徒步' },
          { id: '15', day: 4, time: '10:00', location: '神瀑', description: '雨崩下村→神瀑，单程5公里，2小时', tips: '全程石板路，海拔上升600m', type: '徒步' },
          { id: '16', day: 4, time: '11:30', location: '下雨崩村', description: '神瀑到下雨崩村，全程下坡', tips: '约1小时15分', type: '徒步' },
          { id: '17', day: 4, time: '12:00', location: '皮卡车点', description: '下雨崩村徒步到皮卡车点', tips: '', type: '徒步' },
          { id: '18', day: 4, time: '14:00', location: '尼农', description: '皮卡车点徒步到尼农', tips: '', type: '徒步' },
          { id: '19', day: 4, time: '15:00', location: '香格里拉', description: '尼农-香格里拉', tips: '拼车价格120元左右，用时3-4小时', type: '交通' },
          { id: '20', day: 4, time: '19:00', location: '花香设计师美宿', description: '入住丽江古城民宿', tips: '', type: '住宿' },
          { id: '21', day: 5, time: '09:45', location: '香格里拉站', description: '香格里拉→丽江', tips: '9:45-10:58，车票8.18号开售', type: '交通' },
          { id: '22', day: 5, time: '11:15', location: '丽江市区', description: '丽江市区→机场', tips: '1小时，12:00到机场', type: '交通' },
          { id: '23', day: 5, time: '13:55', location: '丽江机场', description: '吉祥航空 HO1712 返程', tips: '', type: '交通' },
        ]
      },
    ]
  },
]

async function createGuide(guideData) {
  const guide = await prisma.guides.create({
    data: {
      title: guideData.title,
      country: guideData.country,
      city: guideData.city,
      days: guideData.days,
      start_date: guideData.start_date,
      end_date: guideData.end_date,
      show: guideData.show,
      sort: guideData.sort,
    },
  })
  console.log('Created guide:', guide.id, guide.title)

  const createdModules = []
  for (const mod of guideData.modules) {
    const created = await prisma.guideModules.create({
      data: {
        guide_id: guide.id,
        name: mod.name,
        template: mod.template,
      },
    })
    createdModules.push({ ...created, data: mod.data })
    console.log('  Created module:', created.name, created.template)
  }

  for (const mod of createdModules) {
    if (mod.data && mod.data.length > 0) {
      await prisma.guideModuleContents.create({
        data: {
          module_id: mod.id,
          type: 'module_data',
          content: mod.data,
        },
      })
      console.log('    Added', mod.data.length, 'items to', mod.name)
    }
  }

  return guide
}

async function main() {
  try {
    console.log('=== 开始批量创建攻略 ===\n')

    for (let i = 0; i < guidesData.length; i++) {
      console.log(`\n[${i + 1}/${guidesData.length}] 创建攻略: ${guidesData[i].title}`)
      await createGuide(guidesData[i])
    }

    console.log('\n=== 所有攻略创建完成 ===')
    console.log('共创建攻略数量:', guidesData.length)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
