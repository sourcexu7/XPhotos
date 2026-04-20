const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:756357wx.@1.15.172.217:5432/xphotos?schema=public&client_encoding=utf8'
    },
  },
})

async function main() {
  try {
    const existingGuides = await prisma.guides.findMany()
    for (const guide of existingGuides) {
      await prisma.guides.delete({
        where: { id: guide.id }
      })
    }
    console.log('Deleted', existingGuides.length, 'existing guides')

    const guide = await prisma.guides.create({
      data: {
        title: '大兴安岭八天七晚攻略',
        country: '中国',
        city: '呼伦贝尔',
        days: 8,
        start_date: new Date('2025-10-01'),
        end_date: new Date('2025-10-08'),
        show: 1,
        sort: 0,
      },
    })
    console.log('Created guide:', guide.id, guide.title)

    const modules = [
      { name: '时间与花费', template: 'expense' },
      { name: '准备工作', template: 'checklist' },
      { name: '行程安排', template: 'itinerary' },
    ]

    const createdModules = []
    for (const mod of modules) {
      const created = await prisma.guideModules.create({
        data: {
          guide_id: guide.id,
          name: mod.name,
          template: mod.template,
        },
      })
      createdModules.push(created)
      console.log('Created module:', created.name, created.id)
    }

    const expenseModule = createdModules[0]
    
    const expenseItems = [
      { id: '1', name: '南京-杭州', detail: '高铁 G189 19:45-21:01', type: '高铁', channel: '12306', unitPrice: 144, subtotal: 144, category: 'transport', notes: '南京南站-杭州东站' },
      { id: '2', name: '杭州-海拉尔', detail: '飞机 中国国航 ZH8581 6:55-10:25', type: '飞机', channel: '携程', unitPrice: 1038, subtotal: 1038, category: 'transport', notes: '萧山机场T4 - 海拉尔机场，行李额7kg随身+25kg托运' },
      { id: '3', name: '海拉尔-杭州', detail: '飞机 中国国航 CA8356 11:30-15:15', type: '飞机', channel: '携程', unitPrice: 630, subtotal: 630, category: 'transport', notes: '海拉尔机场 - 萧山机场T4，原价1200-570' },
      { id: '4', name: '杭州-南京', detail: '高铁 G36 16:59-18:03', type: '高铁', channel: '12306', unitPrice: 144, subtotal: 144, category: 'transport', notes: '杭州东站-南京南站，需抢票' },
      { id: '5', name: '吉利星越 1.5T', detail: '租车（带保险）', type: '租车', channel: '支付宝', unitPrice: 3023, subtotal: 755.75, category: 'transport', notes: '4人分摊' },
      { id: '6', name: '油费', detail: '海拉尔/阿尔山伊尔施/额尔古纳拉布大林/额尔古纳室韦/额尔古纳黑山头/还车补一格', type: '加油', channel: '中国石油', unitPrice: 1037.83, subtotal: 260, category: 'transport', notes: '4人分摊' },
      { id: '7', name: '高速费', detail: '国庆免费', type: '高速', channel: '-', unitPrice: 0, subtotal: 0, category: 'transport', notes: '' },
      { id: '8', name: '大疆Air3S', detail: '无人机租赁（带屏+3电+安心享）', type: '设备租赁', channel: '支付宝探物', unitPrice: 413.52, subtotal: 413.52, category: 'equipment', notes: '' },
      { id: '9', name: '敖鲁古雅驯鹿部落', detail: '门票', type: '门票', channel: '现场', unitPrice: 78, subtotal: 78, category: 'ticket', notes: '' },
      { id: '10', name: '莫尔道嘎国家森林', detail: '门票', type: '门票', channel: '现场', unitPrice: 130, subtotal: 130, category: 'ticket', notes: '' },
      { id: '11', name: '室韦骑境马场', detail: '骑马', type: '马场', channel: '现场', unitPrice: 100, subtotal: 100, category: 'ticket', notes: '' },
      { id: '12', name: '室韦卡丁车', detail: '卡丁车', type: '娱乐', channel: '现场', unitPrice: 100, subtotal: 50, category: 'ticket', notes: '2人分摊' },
      { id: '13', name: '黑山头哈撒尔马场', detail: '骑马', type: '马场', channel: '现场', unitPrice: 130, subtotal: 130, category: 'ticket', notes: '' },
      { id: '14', name: '黑山头接驳车', detail: '三蹦子', type: '交通', channel: '现场', unitPrice: 40, subtotal: 10, category: 'ticket', notes: '4人分摊' },
      { id: '15', name: '探访农户', detail: '哈撒尔骑马送的', type: '体验', channel: '赠送', unitPrice: 0, subtotal: 0, category: 'ticket', notes: '' },
      { id: '16', name: '国门景区', detail: '套票（电视塔+国门）', type: '门票', channel: '现场', unitPrice: 300, subtotal: 75, category: 'ticket', notes: '4人分摊，单买门票60元' },
      { id: '17', name: '汉庭海拉尔火车站中央大街店', detail: '10.1-10.2 双床房', type: '住宿', channel: '智行', unitPrice: 193, subtotal: 96.5, category: 'accommodation', notes: '2人分摊' },
      { id: '18', name: '阿尔山新华宾馆', detail: '10.2-10.3 特价榻榻米', type: '住宿', channel: '美团', unitPrice: 700, subtotal: 350, category: 'accommodation', notes: '2人分摊' },
      { id: '19', name: '额尔古纳蒙源宾馆', detail: '10.3-10.4 双床房', type: '住宿', channel: '智行', unitPrice: 198, subtotal: 99, category: 'accommodation', notes: '2人分摊' },
      { id: '20', name: '莫尔道嘎如佳宾馆', detail: '10.4-10.5 标准间', type: '住宿', channel: '美团', unitPrice: 282, subtotal: 141, category: 'accommodation', notes: '2人分摊' },
      { id: '21', name: '额尔古纳蒙π部落民宿', detail: '10.5-10.6 标准木屋', type: '住宿', channel: '美团', unitPrice: 249.6, subtotal: 124.8, category: 'accommodation', notes: '2人分摊' },
      { id: '22', name: '额尔古纳黑山头阿拉塔部落', detail: '10.6-10.7 双床蒙古包', type: '住宿', channel: '美团', unitPrice: 286, subtotal: 143, category: 'accommodation', notes: '2人分摊' },
      { id: '23', name: '海友酒店海拉尔成吉思汗广场店', detail: '10.7-10.8 双床房', type: '住宿', channel: '智行', unitPrice: 119, subtotal: 55.5, category: 'accommodation', notes: '2人分摊' },
      { id: '24', name: '海拉尔一群羊', detail: '10.1 午饭', type: '餐饮', channel: '现场', unitPrice: 195, subtotal: 65, category: 'food', notes: '3人分摊' },
      { id: '25', name: '海拉尔菌香园', detail: '10.1 晚饭', type: '餐饮', channel: '现场', unitPrice: 311, subtotal: 77.75, category: 'food', notes: '4人分摊' },
      { id: '26', name: '诺干湖', detail: '10.2 午饭', type: '餐饮', channel: '现场', unitPrice: 274, subtotal: 68.5, category: 'food', notes: '4人分摊' },
      { id: '27', name: '阿尔山新华宾馆', detail: '10.2 晚饭', type: '餐饮', channel: '现场', unitPrice: 91, subtotal: 22.75, category: 'food', notes: '4人分摊' },
      { id: '28', name: '阿尔山伊敏苏木', detail: '10.3 午饭', type: '餐饮', channel: '现场', unitPrice: 158, subtotal: 39.5, category: 'food', notes: '4人分摊' },
      { id: '29', name: '额尔古纳老友铁锅炖', detail: '10.3 晚饭', type: '餐饮', channel: '现场', unitPrice: 219, subtotal: 54.75, category: 'food', notes: '4人分摊' },
      { id: '30', name: '额尔古纳牛肉汤', detail: '10.4 午饭', type: '餐饮', channel: '现场', unitPrice: 125, subtotal: 31.25, category: 'food', notes: '4人分摊' },
      { id: '31', name: '莫尔道嘎木子烤肉', detail: '10.4 晚饭', type: '餐饮', channel: '现场', unitPrice: 346, subtotal: 86.5, category: 'food', notes: '4人分摊' },
      { id: '32', name: '室韦安娜饭店', detail: '10.5 午饭', type: '餐饮', channel: '现场', unitPrice: 206, subtotal: 51.5, category: 'food', notes: '4人分摊' },
      { id: '33', name: '室韦乡源饭店', detail: '10.5 晚饭', type: '餐饮', channel: '现场', unitPrice: 376, subtotal: 94, category: 'food', notes: '4人分摊' },
      { id: '34', name: '黑山头一品香', detail: '10.6 午饭', type: '餐饮', channel: '现场', unitPrice: 264, subtotal: 66, category: 'food', notes: '4人分摊' },
      { id: '35', name: '黑山头鑫梦源火锅', detail: '10.6 晚饭', type: '餐饮', channel: '现场', unitPrice: 233, subtotal: 58.25, category: 'food', notes: '4人分摊' },
      { id: '36', name: '满洲里卢布里西餐厅', detail: '10.7 午饭', type: '餐饮', channel: '现场', unitPrice: 460, subtotal: 115, category: 'food', notes: '4人分摊' },
      { id: '37', name: '河西早市', detail: '10.8 早饭', type: '餐饮', channel: '现场', unitPrice: 18, subtotal: 18, category: 'food', notes: '' },
      { id: '38', name: '海拉尔超市购物', detail: '10.1 晚', type: '购物', channel: '超市', unitPrice: 159.8, subtotal: 39.95, category: 'shopping', notes: '4人分摊' },
      { id: '39', name: '额尔古纳购物', detail: '10.3 晚', type: '购物', channel: '超市', unitPrice: 26, subtotal: 6.5, category: 'shopping', notes: '4人分摊' },
      { id: '40', name: '黑山头购物', detail: '10.5 晚', type: '购物', channel: '超市', unitPrice: 47, subtotal: 11.75, category: 'shopping', notes: '4人分摊' },
      { id: '41', name: '海拉尔友谊大厦超市', detail: '特产', type: '特产', channel: '超市', unitPrice: 192, subtotal: 192, category: 'shopping', notes: '' },
    ]

    await prisma.guideModuleContents.create({
      data: {
        module_id: expenseModule.id,
        type: 'module_data',
        content: expenseItems,
      },
    })
    console.log('Created expense items:', expenseItems.length)

    const checklistModule = createdModules[1]
    
    const checklistCategories = [
      {
        id: '1',
        name: '衣物准备',
        icon: '👚',
        items: [
          { id: '1-1', name: '拍照衣物', checked: false },
          { id: '1-2', name: '墨镜', checked: false },
          { id: '1-3', name: '冲锋衣、羽绒服', checked: false },
          { id: '1-4', name: '防晒面罩', checked: false },
        ]
      },
      {
        id: '2',
        name: '日常用品',
        icon: '🛂',
        items: [
          { id: '2-1', name: '身份证、驾照', checked: false },
          { id: '2-2', name: '手机充电器、充电宝、手表充电器', checked: false },
          { id: '2-3', name: '卫生纸4包、防晒霜', checked: false },
          { id: '2-4', name: '头枕', checked: false },
        ]
      },
      {
        id: '3',
        name: '摄影设备',
        icon: '📷',
        items: [
          { id: '3-1', name: '无人机（租赁）', checked: false },
          { id: '3-2', name: '大疆Pocket3全能套装（租赁）', checked: false },
          { id: '3-3', name: 'A7C2、镜头（24-70、70-200租赁）三脚架、手机', checked: false },
          { id: '3-4', name: '存储卡、读卡器、电池、电池充电器、清洁用品', checked: false },
        ]
      },
      {
        id: '4',
        name: '导航',
        icon: '📲',
        items: [
          { id: '4-1', name: '提前下载好离线地图', checked: false },
        ]
      },
    ]

    await prisma.guideModuleContents.create({
      data: {
        module_id: checklistModule.id,
        type: 'module_data',
        content: checklistCategories,
      },
    })
    console.log('Created checklist categories:', checklistCategories.length)

    const itineraryModule = createdModules[2]
    
    const itineraryItems = [
      { id: '1', day: 1, time: '05:30', location: '萧山机场', duration: '航班', description: '出发到达萧山机场，乘坐中国国航 CA8355 6:55-10:25 航班', tips: '10:25落地海拉尔机场', type: '交通' },
      { id: '2', day: 1, time: '11:00', location: '海拉尔市区', duration: '1小时', description: '吃饭', tips: '', type: '餐饮' },
      { id: '3', day: 1, time: '12:00', location: '海拉尔机场', duration: '下午', description: '从海拉尔机场出发，租车取车', tips: '宿汉庭海拉尔火车站中央大街店', type: '交通' },
      { id: '4', day: 2, time: '08:00', location: '海拉尔市区', duration: '全天', description: '海拉尔出发，租车自驾', tips: '', type: '交通' },
      { id: '5', day: 2, time: '08:30', location: '伊敏苏木', duration: '1.5小时', description: '202国道 98公里，公路左边有绝美河流和树林', tips: '', type: '景点' },
      { id: '6', day: 2, time: '12:00', location: '阿尔山天池航拍点', duration: '3.5小时', description: '202国道+331国道+旅游路 242公里', tips: '航拍阿尔山天池不需要买票进景点，在天池服务区检票口附近升高500米即可', type: '景点' },
      { id: '7', day: 2, time: '16:00', location: '不冻河', duration: '30分钟', description: '杜鹃湖航拍点 => 不冻河，22公里', tips: '拍不冻河日落、蓝房子', type: '景点' },
      { id: '8', day: 2, time: '晚上', location: '阿尔山天池服务区', duration: '住宿', description: '宿阿尔山得舍民宿酒店国家森林公园店', tips: '', type: '住宿' },
      { id: '9', day: 3, time: '05:30', location: '乌苏浪子湖', duration: '早晨', description: '乌苏浪子湖晨雾，整个湖面弥漫薄雾', tips: '5:00陆续有人到观景台，日出5:59，5:38湖东开始起雾，6:30左右雾最佳', type: '景点' },
      { id: '10', day: 3, time: '08:00', location: '海拉尔市区', duration: '4.5小时', description: '乌苏浪子湖 => 海拉尔市区，332.7公里', tips: '', type: '交通' },
      { id: '11', day: 3, time: '15:00', location: '莫尔格勒河（北线断崖）', duration: '1.5小时', description: '海拉尔市区 => 莫尔格勒河，72公里', tips: '2024.9.18后莫日格勒河南线不让自驾，走北线，导航马背山', type: '景点' },
      { id: '12', day: 3, time: '17:00', location: '额尔古纳市', duration: '2小时', description: '断崖 => 额尔古纳市，128公里', tips: '宿额尔古纳蒙源宾馆', type: '交通' },
      { id: '13', day: 4, time: '06:00', location: '拉布达林农牧场第四生产队', duration: '早晨', description: '日出（可选行程）', tips: '', type: '景点' },
      { id: '14', day: 4, time: '09:00', location: '敖鲁古雅驯鹿部落', duration: '2小时', description: '额尔古纳湿地 => 根河 => 敖鲁古雅驯鹿部落，129公里', tips: '在9:00-11:00驯鹿活跃度最高的时段到达驯鹿苑，是中国唯一一个使鹿部落', type: '景点' },
      { id: '15', day: 4, time: '12:00', location: '湿地出口', duration: '1小时', description: '吃午饭，湿地出口处右边自助餐58元/人', tips: '', type: '餐饮' },
      { id: '16', day: 4, time: '14:00', location: '莫尔道嘎镇', duration: '2小时', description: '敖鲁古雅驯鹿部落 => 莫尔道嘎镇，128公里', tips: '走根河到白鹿岛的325省道（根白公路）', type: '交通' },
      { id: '17', day: 4, time: '晚上', location: '莫尔道嘎镇', duration: '住宿', description: '宿莫尔道嘎如佳宾馆', tips: '', type: '住宿' },
      { id: '18', day: 5, time: '08:00', location: '莫尔道嘎森林公园', duration: '20分钟', description: '莫尔道嘎镇 => 莫尔道嘎森林公园，12公里', tips: '莫尔道嘎公园小火车全程1小时左右，停4个站，自驾只需买100元/人门票', type: '景点' },
      { id: '19', day: 5, time: '10:00', location: '白鹿岛', duration: '1.5小时', description: '莫尔道嘎森林公园 => 白鹿岛，87公里', tips: '', type: '景点' },
      { id: '20', day: 5, time: '12:00', location: '室韦', duration: '2小时', description: '白鹿岛 => 室韦，140公里，走331国道', tips: '', type: '交通' },
      { id: '21', day: 5, time: '15:00', location: '临江屯', duration: '20分钟', description: '室韦 => 临江，9公里', tips: '临江屯界碑导航（界河观景点神仙坡），爬上小山坡能看到112界碑，眺望俄罗斯', type: '景点' },
      { id: '22', day: 5, time: '18:00', location: '室韦', duration: '晚上', description: '室韦吃饭，推荐拉娅之家（俄罗斯族阿姨开的餐厅）', tips: '份量和味道都很实诚，正宗的俄罗斯餐，需早点去', type: '餐饮' },
      { id: '23', day: 5, time: '晚上', location: '临江屯', duration: '住宿', description: '宿额尔古纳蒙π部落民宿', tips: '', type: '住宿' },
      { id: '24', day: 6, time: '05:20', location: '临江', duration: '早晨', description: '起床准备去看日出', tips: '', type: '景点' },
      { 
        id: '25', 
        day: 6, 
        time: '06:07', 
        location: '临江', 
        duration: '早晨', 
        description: '临江日出', 
        tips: '导航建议：阿萍餐馆', 
        type: '景点',
        links: [
          { url: 'https://www.xiaohongshu.com/discovery/item/63258e7a0000000008019b63', title: '临江屯日出晨雾攻略', platform: '小红书' },
          { url: 'https://www.xiaohongshu.com/discovery/item/66ef73ef000000000c018ae7', title: '临江人生照片', platform: '小红书' }
        ]
      },
      { id: '26', day: 6, time: '08:00', location: '卡线', duration: '2.5小时', description: '临江 => 室韦 => 九卡 => 七卡 => 乌兰山，116公里', tips: '走X904（中俄边境界河沿线），卡线精华路段在七卡到九卡', type: '景点' },
      { id: '27', day: 6, time: '11:00', location: '黑山头', duration: '1.5小时', description: '乌兰山 => 五卡 => 黑山头，65公里', tips: '', type: '交通' },
      { id: '28', day: 6, time: '15:00', location: '黑山头访户', duration: '2小时', description: '访牧户：喂奶、骑马、射箭、蒙古服饰拍照等', tips: '推荐：美丽草原之家、欣欣绿色草原访牧户', type: '娱乐' },
      { id: '29', day: 6, time: '18:00', location: '黑山头日落', duration: '傍晚', description: '黑山头日落', tips: '导航日落山，步行20-30分钟上山观赏日落', type: '景点' },
      { id: '30', day: 6, time: '晚上', location: '黑山头', duration: '住宿', description: '宿额尔古纳黑山头阿拉塔部落', tips: '', type: '住宿' },
      { id: '31', day: 7, time: '08:00', location: '满洲里国门', duration: '3小时', description: '黑山头 => 满洲里国门，207公里', tips: '', type: '交通' },
      { id: '32', day: 7, time: '11:00', location: '套娃广场', duration: '中午', description: '满洲里国门 => 套娃广场，4公里 7分钟', tips: '国门景区套票（电视塔+国门）145元/人，单买门票60元', type: '景点' },
      { id: '33', day: 7, time: '12:00', location: '卢布里西餐厅', duration: '1.5小时', description: '午饭卢布里西餐厅', tips: '', type: '餐饮' },
      { id: '34', day: 7, time: '14:00', location: '拴马桩', duration: '1.5小时', description: '套娃广场 => 拴马桩，93公里', tips: '', type: '景点' },
      { id: '35', day: 7, time: '16:00', location: '海拉尔市区', duration: '3.5小时', description: '拴马桩 => 海拉尔市区，295公里', tips: '宿海友酒店海拉尔成吉思汗广场店', type: '交通' },
    ]

    await prisma.guideModuleContents.create({
      data: {
        module_id: itineraryModule.id,
        type: 'module_data',
        content: itineraryItems,
      },
    })
    console.log('Created itinerary items:', itineraryItems.length)

    console.log('\n=== 攻略创建完成 ===')
    console.log('攻略ID:', guide.id)
    console.log('攻略标题:', guide.title)
    console.log('模块数量:', createdModules.length)
    console.log('费用明细条数:', expenseItems.length)
    console.log('准备清单分类数:', checklistCategories.length)
    console.log('行程条数:', itineraryItems.length)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
