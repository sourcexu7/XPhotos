// 印尼六天五晚旅游攻略上传脚本
// 使用方法: node scripts/upload-guide.mjs http://localhost:3000
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const args = process.argv.slice(2)
const BASE_URL = args[0] || process.env.API_BASE_URL || 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL || '87602307@qq.com'
const PASSWORD = process.env.ADMIN_PASSWORD || '756357Wx.'

const API = `${BASE_URL}/api/v1`

async function request(pathname, options = {}) {
  const url = `${API}${pathname}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${pathname}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }
  return data
}

// 登录获取 token
async function login() {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.token) {
    throw new Error('登录失败: 未返回 token')
  }
  console.log(`✅ 登录成功: ${res.user?.email || res.user?.name || EMAIL}`)
  return res.token
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

// 查询所有攻略，查找印尼相关
async function findExistingIndonesiaGuides(token) {
  const data = await request('/guides/list', { headers: authHeaders(token) })
  const guides = Array.isArray(data) ? data : data.data || []
  const indonesia = guides.filter(
    (g) =>
      (g.title && g.title.includes('印尼')) ||
      (g.country && g.country.includes('印尼')) ||
      (g.city && g.city.includes('巴厘')) ||
      (g.city && g.city.includes('科莫'))
  )
  return indonesia
}

async function deleteGuide(token, id, title) {
  await request(`/guides/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  console.log(`🗑️  删除旧攻略: ${title} (${id})`)
}

async function createGuide(token, payload) {
  const res = await request('/guides', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return res.data || res
}

async function createModule(token, guideId, name, template) {
  const res = await request('/guide-modules/module', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ guide_id: guideId, name, template: template || null }),
  })
  return res.data || res
}

async function saveModuleData(token, moduleId, data) {
  const res = await request(`/guide-modules/module-data/${moduleId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ data }),
  })
  return res
}

async function createModuleContent(token, moduleId, type, content) {
  const res = await request('/guide-modules/content', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ module_id: moduleId, type, content }),
  })
  return res.data || res
}

// 解析 md 文件中的一段文本（在 `:::xxx ... :::` 内的可能包含图片，普通 markdown 也能直接存）
function buildItineraryItems() {
  return [
    {
      id: 'day1',
      date: '4.30',
      title: '第一天 落地科莫多半日游',
      location: '机场 => 码头 => Zasgo酒店 => 海鲜一条街',
      description:
        '14:25 落地科莫多机场，15:30 抵达 Zasgo 酒店。傍晚前往海鲜一条街，推荐 KEDAI ANA（梭子蟹370k、青龙350k、椰子4个100k）。',
      tips: '全程做好防晒；傍晚海上会降温，浮潜后换上干衣服。',
      highlights: ['海鲜一条街', 'KEDAI ANA 海鲜'],
    },
    {
      id: 'day2',
      date: '5.1',
      title: '第二天 科莫多一日游',
      location: '帕达尔岛 => 粉色沙滩 => 科莫多岛 => 浮潜 => 海鲜一条街',
      description:
        '07:00 码头发船。08:30-10:00 帕达尔岛徒步（约815级石阶，侧逆光拍山脊肌理，需 CPL 消反光）；10:30-12:00 粉色红滩（正午直射光下粉色最嫩）；12:30-14:30 科莫多岛（需确认是国家公园非科莫多村）；14:30-16:30 浮潜（Manta Point > 月牙湾 > 海龟点）。晚餐 KEDAI NATALI（7个生蚝100k、东星斑130k、梭子蟹300k、4只小鱿鱼100k，一桌1100k）。',
      tips: '一日游团费约 1000k/人，国家公园门票额外 400k/人。',
      highlights: ['帕达尔岛', '粉色红滩', '科莫多巨蜥', '浮潜'],
    },
    {
      id: 'day3',
      date: '5.2',
      title: '第三天 库塔附近一日游',
      location: '落地巴厘岛 => 巴厘火射击俱乐部 => 黑沙滩 => 神奇动物园 => 沙努尔码头',
      description:
        '09:50 抵达巴厘岛机场(DPS)；11:10-12:30 前往巴厘火射击俱乐部（880k 4种枪械 8 发子弹套餐）；12:30-15:00 Swan Restaurant Keramas（黑沙滩餐厅，炒面炒饭和云吞推荐）；神奇动物园（门票 250k，零距离接触 230k，套票 450k）。',
      tips: '酒店建议 Sri Phala Resort & Villa。',
      highlights: ['巴厘火射击', '黑沙滩', '神奇动物园'],
    },
    {
      id: 'day4',
      date: '5.3',
      title: '第四天 佩尼达岛一日游',
      location: 'Sanur码头 => 东线钻石沙滩 => 西线精灵坠崖 => 破碎沙滩',
      description:
        '7:30 Sanur 码头发船（Semabu Hill 快船公司 50 分钟）；8:00 抵达佩妮达，上岛费 25k；10:00-11:00 钻石沙滩（悬崖 S 型阶梯机位）；13:00-14:30 精灵坠崖；破碎沙滩与天神浴池步行可达。',
      tips: '佩尼达岛日照极强，高倍防晒；包车司机推荐微信 kar04061994。',
      highlights: ['钻石沙滩', '精灵坠崖', '破碎沙滩'],
    },
    {
      id: 'day5',
      date: '5.4',
      title: '第五天 乌鲁瓦图一日游',
      location: '滑翔伞 => 悬崖公路 => 情人崖 => 金巴兰日落',
      description:
        '11:30-13:30 悬崖滑翔伞（Timbis）；15:00-16:30 悬崖公路 Pantai Tanah Barak（门票 15k/人，观光车 30k/人）；16:30 乌鲁瓦图寺（情人崖，门票 50k/人，注意猴子抢墨镜手机）；17:30-19:30 金巴兰日落晚餐 Sakura by Menega。',
      tips: '酒店建议 Gaing Mas Jimbaran Villas。',
      highlights: ['滑翔伞', '悬崖公路', '情人崖', '金巴兰日落'],
    },
    {
      id: 'day6',
      date: '5.5',
      title: '第六天 回程',
      location: 'Gunung Payung Beach => Bintang => LarisStone => 机场',
      description:
        '9:00 Grab 前往 Gunung Payung Beach（洞穴构图，浪大注意）；Bintang 购买特产；Laris Stone 购买小石纪念品；19:50 起飞（鹰航，如在雅加达转机需从国内出发）。',
      tips: '雅加达转机需从国内出发厅出发，避免来回折腾。',
      highlights: ['Gunung Payung', 'Bintang 特产', 'LarisStone'],
    },
  ]
}

function buildExpenseItems() {
  const items = [
    ['取现 · 中国银行取现', '取现', 'other', 605],
    ['取现 · 旭信用卡取现', '取现', 'other', 252.26],
    ['取现 · 涛信用卡取现', '取现', 'other', 33.33],
    ['签证 · 电子签', '签证', 'other', 204.26],
    ['机票 · 南京-新加坡-吉隆坡', '去哪儿', 'transport', 955],
    ['机票 · 吉隆坡-科莫多', '去哪儿', 'transport', 657],
    ['选座 · 吉隆坡-科莫多', '亚航官网', 'transport', 29.57],
    ['行李额 · 吉隆坡-科莫多', '亚航官网', 'transport', 114.33],
    ['机票 · 科莫多-巴厘岛', '去哪儿', 'transport', 419],
    ['机票 · 巴厘岛-雅加达-上海', '去哪儿', 'transport', 1977],
    ['租赁 · Action5 pro', '支付宝惠租', 'equipment', 138.55],
    ['租赁 · DJI mini5 pro', '支付宝惠租', 'equipment', 320.4],
    ['电话卡 · 7天100G', '淘宝飞猪', 'other', 66.75],
    ['高铁 · 上海-南京', '12306', 'transport', 162],
    ['市域铁 · 上海市域铁', '银联一卡通', 'transport', 26],
    ['地铁 · 禄口机场', '支付宝', 'transport', 7.6],
    ['船票 · 巴厘岛-佩妮达', '携程', 'transport', 54],
    ['船票 · 佩妮达-巴厘岛', '携程', 'transport', 45],
    ['打车 · 5.5 酒店-Gunung Payung', 'Grab', 'transport', 5.11],
    ['打车 · 5.5 海滩-酒店-Bingtang', 'Grab', 'transport', 0], // 现金
    ['打车 · 5.5 Bingtang-LarisStone', 'Grab', 'transport', 2.68],
    ['打车 · 5.5 LarisStone-酒店', 'Grab', 'transport', 5.66],
    ['打车 · 5.5 酒店-机场', 'Grab', 'transport', 4.91],
    ['包车 · 5.2 zasgo-机场', '酒店联系', 'transport', 0],
    ['包车 · 5.2 巴厘岛全天', '蒋老师推荐', 'transport', 0],
    ['包车 · 5.3 佩妮达', '小红书', 'transport', 0],
    ['包车 · 5.4 乌鲁瓦图', '蒋老师推荐', 'transport', 0],
    ['住宿 · 4.30-5.1 Zasgo Hotel', '去哪儿', 'accommodation', 167],
    ['住宿 · 5.1-5.2 Zasgo Hotel', '去哪儿', 'accommodation', 167],
    ['住宿 · 5.2-5.3 Sri Phala Resort', '去哪儿', 'accommodation', 183.5],
    ['住宿 · 5.3-5.4 Maruti beach Villas', '去哪儿', 'accommodation', 181],
    ['住宿 · 5.4-5.5 Gaing Mas Jimbaran', '去哪儿', 'accommodation', 193],
    ['餐饮 · 樟宜机场', '线下/alipay', 'food', 42.39],
    ['餐饮 · 吉隆坡机场早饭', '线下/alipay', 'food', 53.21],
    ['餐饮 · 4.30 KEDAI ANA 海鲜', '线下', 'food', 0],
    ['餐饮 · 5.1 KEDAI NATALI 海鲜', '线下', 'food', 0],
    ['餐饮 · 5.2 黑沙滩 Swan', '线下', 'food', 0],
    ['餐饮 · 5.2 印尼泡面', '线下', 'food', 0],
    ['餐饮 · 5.3 佩妮达午饭', '线下/alipay', 'food', 39.39],
    ['餐饮 · 5.3 KELAPA PEINIDA', '线下/visa', 'food', 43.1],
    ['餐饮 · 5.4 乌鲁瓦图 BEJANA', '线下/alipay', 'food', 73.7],
    ['餐饮 · 5.4 SEDERHANA BALI', '线下/alipay', 'food', 54.69],
    ['餐饮 · 5.5 VIENAM BISTRO', '线下/alipay', 'food', 47.19],
    ['购物 · 吉隆坡 MYNEWS', '线下/alipay', 'shopping', 14.22],
    ['购物 · Miniso', '线下/alipay', 'shopping', 11.87],
    ['购物 · 5.1 DENNYS MART', '线下/alipay', 'shopping', 28.59],
    ['购物 · 5.3 UNCLEJOBYSE', '线下/alipay', 'shopping', 14.69],
    ['购物 · 5.4 上午超市 COCO', '线下/alipay', 'shopping', 13.3],
    ['购物 · 5.4 下午 NIRMALA', '线下/alipay', 'shopping', 3.57],
    ['购物 · 5.5 Bintang', '线下/alipay', 'shopping', 467.85],
    ['购物 · 5.5 MINIMART SR2', '线下/visa', 'shopping', 102.49],
    ['购物 · 5.5 雅加达机场', '线下', 'shopping', 0],
    ['购物 · 5.5 雅加达机场', '线下/alipay', 'shopping', 5.94],
    ['一日游 · 5.1 科莫多8景点含日落', '小红书/alipay', 'ticket', 882.47],
    ['娱乐 · 5.2 Bali Fire 射击', '向导/alipay', 'other', 349.5],
    ['娱乐 · 5.3 OMG SPA', '线下/visa', 'other', 60.93],
    ['门票 · 5.2 Minizoo', '线下', 'ticket', 0],
    ['门票 · 5.3 佩妮达上岛费', '扫码trip', 'ticket', 10],
    ['门票 · 5.3 钻石沙滩', '线下', 'ticket', 0],
    ['门票 · 5.4 情人崖', '线下', 'ticket', 0],
    ['停车费 · 5.3 钻石沙滩', '线下', 'other', 0],
    ['停车费 · 5.3 精灵坠崖', '线下', 'other', 0],
    ['停车费 · 5.3 破碎沙滩', '线下', 'other', 0],
    ['游玩 · 5.4 滑翔伞10分钟', '飞猪', 'ticket', 186.2],
    ['纪念品 · 5.5 LarisStone', '线下/alipay', 'shopping', 23.74],
  ]
  return items.map((row, i) => {
    const [name, channel, category, price] = row
    return {
      id: `exp-${i + 1}`,
      name,
      detail: '',
      type: category,
      channel,
      unitPrice: price,
      subtotal: price,
      category,
      notes: '',
    }
  })
}

function buildChecklistItems() {
  return [
    {
      id: 'checklist-1',
      name: '日常证件 / 日用品',
      items: [
        { id: 'c1-1', name: '身份证', checked: true },
        { id: 'c1-2', name: '护照', checked: true },
        { id: 'c1-3', name: '电子签证 (evisa.imigrasi.go.id)', checked: true },
        { id: 'c1-4', name: '欧标/德标双圆头转换插头', checked: true },
        { id: 'c1-5', name: '入境卡（官网填写并截图）', checked: true },
        { id: 'c1-6', name: '电话卡', checked: true },
        { id: 'c1-7', name: '境外险 / 印尼盾兑换（约3000 RMB）', checked: false },
        { id: 'c1-8', name: '往返机票行程单 + 酒店确认单', checked: true },
        { id: 'c1-9', name: '吹风机', checked: true },
        { id: 'c1-10', name: '剃须刀', checked: true },
        { id: 'c1-11', name: '便携背包', checked: true },
      ],
    },
    {
      id: 'checklist-2',
      name: '衣物准备',
      items: [
        { id: 'c2-1', name: '泳衣泳镜', checked: true },
        { id: 'c2-2', name: '墨镜 / 项链', checked: true },
        { id: 'c2-3', name: '水母衣', checked: true },
        { id: 'c2-4', name: '日常衣服', checked: true },
        { id: 'c2-5', name: '拖鞋', checked: true },
        { id: 'c2-6', name: '冲锋衣 / 防晒衣', checked: true },
        { id: 'c2-7', name: '防晒霜', checked: true },
        { id: 'c2-8', name: '耳塞', checked: true },
        { id: 'c2-9', name: '密封袋装衣服', checked: true },
        { id: 'c2-10', name: '遮阳帽', checked: true },
        { id: 'c2-11', name: '饰品', checked: true },
      ],
    },
    {
      id: 'checklist-3',
      name: '电子产品 / 摄影装备',
      items: [
        { id: 'c3-1', name: '手机 + 数据线', checked: true },
        { id: 'c3-2', name: '蓝牙耳机', checked: true },
        { id: 'c3-3', name: '充电宝 (≤160Wh，严禁托运)', checked: true },
        { id: 'c3-4', name: '插头 / 转换头', checked: true },
        { id: 'c3-5', name: '手表 / 手机数据线', checked: true },
        { id: 'c3-6', name: '无人机 DJI mini5 pro', checked: true },
        { id: 'c3-7', name: 'Action5 pro', checked: true },
        { id: 'c3-8', name: '相机 A7C2', checked: true },
        { id: 'c3-9', name: '镜头 20-70mm', checked: true },
        { id: 'c3-10', name: '相机电池 / 存储卡 / 读卡器', checked: true },
        { id: 'c3-11', name: '便携支架', checked: true },
        { id: 'c3-12', name: '滤镜 CPL', checked: true },
      ],
    },
    {
      id: 'checklist-4',
      name: '药品',
      items: [
        { id: 'c4-1', name: '晕船药（提前半小时服用）', checked: true },
        { id: 'c4-2', name: '肠胃药（蒙脱石散 / 益生菌）', checked: true },
      ],
    },
    {
      id: 'checklist-5',
      name: '必备软件',
      items: [
        { id: 'c5-1', name: 'Grab（打车 + 外卖）', checked: true },
        { id: 'c5-2', name: 'Google Maps', checked: true },
        { id: 'c5-3', name: 'Google 翻译', checked: true },
      ],
    },
  ]
}

function buildTransportItems() {
  return [
    {
      id: 'trans-1',
      type: 'flight',
      route: '南京禄口机场 → 新加坡樟宜',
      flightNo: '酷航 TR181',
      company: '酷航',
      date: '2026年4月29日',
      time: '17:05 - 22:25',
      baggage: '随身 10kg（可超）',
      price: 955,
      notes: '随身 10kg',
    },
    {
      id: 'trans-2',
      type: 'flight',
      route: '新加坡樟宜 → 吉隆坡',
      flightNo: '酷航 TR456',
      company: '酷航',
      date: '2026年4月30日',
      time: '04:50 - 06:00',
      baggage: '随身 10kg',
      price: 0,
      notes: '含在联程票中',
    },
    {
      id: 'trans-3',
      type: 'flight',
      route: '吉隆坡 → 科莫多（下拉布安）',
      flightNo: '亚航 AK336',
      company: '亚航',
      date: '2026年4月30日',
      time: '10:45 - 14:25',
      baggage: '随身 7kg + 付费 7kg (+119.16元)',
      price: 657,
      notes: '需提前选座 29.57 元 / 行李额 114.33 元',
    },
    {
      id: 'trans-4',
      type: 'flight',
      route: '科莫多（下拉布安）→ 巴厘岛登巴萨',
      flightNo: '亚航 QZ645',
      company: '亚航',
      date: '2026年5月2日',
      time: '08:35 - 09:50',
      baggage: '随身 7kg / 托运 15kg',
      price: 419,
      notes: '直飞约 1h15min',
    },
    {
      id: 'trans-5',
      type: 'flight',
      route: '巴厘岛登巴萨 → 雅加达',
      flightNo: '鹰航 GA421',
      company: '鹰航',
      date: '2026年5月5日',
      time: '19:50 - 20:50',
      baggage: '随身 7kg / 托运 30kg',
      price: 1977,
      notes: '与下一段联程',
    },
    {
      id: 'trans-6',
      type: 'flight',
      route: '雅加达 → 上海（跨天）',
      flightNo: '鹰航 GA894',
      company: '鹰航',
      date: '2026年5月6日',
      time: '23:55 - 次日 07:05',
      baggage: '随身 7kg / 托运 30kg',
      price: 0,
      notes: '联程，国内出发厅转机',
    },
    {
      id: 'trans-7',
      type: 'car',
      company: '酒店联系包车',
      pickup: 'Zasgo 酒店',
      dropoff: '科莫多机场',
      date: '2026年5月2日',
      time: '包车前往',
      notes: '现金支付',
    },
    {
      id: 'trans-8',
      type: 'car',
      company: '蒋老师推荐 (微信 deone91)',
      pickup: '巴厘岛机场',
      dropoff: '巴厘岛全天',
      days: 1,
      date: '2026年5月2日',
      time: '全天',
      notes: '现金支付，需提前沟通油费/停车费/司机餐费',
    },
    {
      id: 'trans-9',
      type: 'car',
      company: '小红书联系 (微信 kar04061994)',
      pickup: '佩妮达',
      dropoff: '佩妮达东西线',
      days: 1,
      date: '2026年5月3日',
      time: '全天',
      notes: '现金支付',
    },
    {
      id: 'trans-10',
      type: 'car',
      company: '蒋老师推荐 (微信 deone91)',
      pickup: '乌鲁瓦图',
      dropoff: '乌鲁瓦图',
      days: 1,
      date: '2026年5月4日',
      time: '全天',
      notes: '现金支付',
    },
    {
      id: 'trans-11',
      type: 'train',
      route: '上海 - 南京',
      trainNo: '高铁',
      company: '12306',
      date: '2026年4月29日',
      time: '城际高铁',
      price: 162,
      notes: '银行卡支付',
    },
    {
      id: 'trans-12',
      type: 'car',
      route: 'Sanur → 佩妮达岛',
      company: 'Semabu Hill 快船',
      date: '2026年5月3日',
      time: '7:30 发船，50分钟',
      price: 54,
      notes: '携程购票，上岛费另付 25k',
    },
    {
      id: 'trans-13',
      type: 'car',
      route: '佩妮达 → Sanur',
      company: '快船',
      date: '2026年5月4日',
      time: '09:00 发船，40分钟',
      price: 45,
      notes: '携程购票 Angel Billabong',
    },
  ]
}

// 行程总览（markdown 文本模块）
function buildOverviewText() {
  return `### 行程总览

| 日期 | 路线 | 时间 | 摄影内容 |
| --- | --- | --- | --- |
| 4.30 | 落地科莫多 LBJ → 卡隆岛蝙蝠日落 | 16:00 - 18:30 | 万蝠出巢晚霞 |
| 5.01 | 科莫多一日游 | 07:00 - 16:30 | 帕达尔岛 / 寻踪巨蜥 / 粉红滩 |
| 5.02 | 落地巴厘岛 → 巴厘岛一日游 | 13:00 - 18:30 | 黑沙滩 / Hidden Mini Zoo / 沙努尔码头 |
| 5.03 | 佩尼达岛东西线精选 | 07:00 - 17:00 | 钻石沙滩 / 精灵坠崖 |
| 5.04 | 乌鲁瓦图一日游 | 11:30 - 19:30 | 崖顶滑翔伞 / 悬崖公路 / 情人崖 / 金巴兰 |

### 大交通情况
- 南京 → 新加坡 → 吉隆坡 → 科莫多（下拉布安）（联程/分段）
- 科莫多 → 巴厘岛（直飞 1h15min）
- 巴厘岛 → 雅加达 → 上海（跨天）
- 高铁/市域铁往返上海 - 南京
- 印尼境内主要交通：快船 + 包车 + Grab 打车

### 时间 & 花费汇总
出行日期：2026.04.29 - 2026.05.06
个人合计约 **￥9,505.94**（机票、住宿、餐饮、门票、购物、交通、租赁、签证等分项详见费用模块）。

> 注：部分项目通过现金支付，已计入取现部分，不再重复。
`
}

// 准备工作（入境攻略 / 无人机 / 包车 / 海鲜一条街 小贴士）
function buildPreparationText() {
  return `### 🚶 入境攻略
- 提前在 [印尼电子签证官网](https://evisa.imigrasi.go.id) 申请电子签证（约 230-260 RMB），Visa 卡缴费后下载电子签证 PDF。
- 入境前三天在印尼官网填写入境卡，保存截图。
- 建议准备往返机票行程单 + 酒店确认单备查。

### ⚠️ 无人机攻略
- **科莫多国家公园**：必须通过 SIORA 系统申请 SIMAKSI 许可证，核心区拍摄费约 2,100,000 IDR/天 (约 800 RMB)；严禁在巨蜥栖息地上空低飞，听从护林员指导。
- **巴厘岛**：海神庙、乌鲁瓦图等神庙区域严禁未经许可飞行；合法点位如 Pasut 黑沙滩、佩尼达岛崖边开放，限高 150m。

### 🚙 包车攻略
- 推荐通过携程 / Traveloka / Klook 等平台预订（有平台中间方，避免纠纷）。
- 务必提前通过 WhatsApp 与司机沟通行程、费用、包含项目（油费/过路费/停车费/司机餐费）、超时/超公里收费。
- 小费文化：巴厘岛司机收入不高，服务满意建议给 50,000-100,000 印尼盾/天。
- 推荐微信：deone91（蒋老师推荐巴厘岛 & 乌鲁瓦图包车）、kar04061994（佩妮达包车）。

### 🐟 科莫多海鲜一条街攻略
- **店铺推荐**：KEDAI ANA（梭子蟹、青龙推荐）、KEDAI NATALI（服务热情，烹饪用心，会中文大姐沟通方便）、KASIMPA WALI（老板实在，价格厚道）。
- **砍价心法**：目标价 180-250k 印尼盾/公斤，大胆出价，尤其注意鱼的品种和加工费；每一样都当场确认价格并记住。
- **挑选海鲜**：认准“明亮清澈”的眼睛（刚上岸的鲜货），本地推荐拿破仑鱼（Kaka Tua）。
- **推荐做法**：鱼首选烤（Grill）、鱿鱼 BBQ 或辣炒、贝类/龙虾辣炒或黄油蒜蓉烤、炒空心菜。
- **避坑提醒**：挑好后亲眼看着厨房烹饪，防止被换成不新鲜的；环境是路边大排档，介意可打包；傍晚 5 点后才开始营业。

### 🛡️ 安全小贴士
- 乌鲁瓦图寺猴子较多，注意手机、墨镜、帽子。
- 佩尼达岛日照极强，高倍防晒 + 补水。
- 雅加达转机需从国内出发厅出发，避免走国外出发厅来回折腾。
- 印尼水质和食物可能引起肠胃不适，自备肠胃药。
`
}

async function main() {
  console.log(`🌐 API 地址: ${API}`)
  const token = await login()

  // 查找并删除旧印尼攻略
  const oldGuides = await findExistingIndonesiaGuides(token)
  if (oldGuides.length > 0) {
    console.log(`🔎 发现 ${oldGuides.length} 条旧印尼攻略:`)
    for (const g of oldGuides) {
      console.log(`   - ${g.title} (${g.id})`)
      await deleteGuide(token, g.id, g.title)
    }
  } else {
    console.log('ℹ️  未发现旧印尼攻略，跳过删除。')
  }

  // 创建新攻略
  const guide = await createGuide(token, {
    title: '印尼六天五晚旅游攻略（科莫多 + 巴厘岛）',
    country: '印度尼西亚',
    city: '科莫多 / 巴厘岛',
    days: 6,
    start_date: '2026-04-29',
    end_date: '2026-05-05',
    cover_image: null,
    content: null,
    show: 1,
    sort: 0,
  })
  const guideId = guide.id
  console.log(`📝 已创建新攻略: ${guide.title} (${guideId})`)

  // 1. 行程总览模块（文本 + 表格）
  const overviewModule = await createModule(token, guideId, '行程总览', 'text')
  await createModuleContent(token, overviewModule.id, 'markdown', {
    text: buildOverviewText(),
  })
  console.log('   ✅ 行程总览模块')

  // 2. 交通模块
  const transportModule = await createModule(token, guideId, '交通信息', 'transport')
  await saveModuleData(token, transportModule.id, buildTransportItems())
  console.log('   ✅ 交通模块')

  // 3. 费用模块
  const expenseModule = await createModule(token, guideId, '费用明细', 'expense')
  await saveModuleData(token, expenseModule.id, buildExpenseItems())
  console.log('   ✅ 费用模块')

  // 4. 物品清单模块
  const checklistModule = await createModule(token, guideId, '物品清单', 'checklist')
  await saveModuleData(token, checklistModule.id, buildChecklistItems())
  console.log('   ✅ 物品清单模块')

  // 5. 行程模块（按天）
  const itineraryModule = await createModule(token, guideId, '每日行程', 'itinerary')
  await saveModuleData(token, itineraryModule.id, buildItineraryItems())
  console.log('   ✅ 每日行程模块')

  // 6. 准备工作 / 小贴士模块
  const tipsModule = await createModule(token, guideId, '准备工作与小贴士', 'tips')
  await saveModuleData(token, tipsModule.id, [
    { id: 'tip-1', title: '入境与签证', content: '提前申请电子签证，填写入境卡，备妥机票行程单与酒店确认单。' },
    { id: 'tip-2', title: '货币与支付', content: '建议兑换 2000-3000 元人民币的印尼盾现金，部分出租车、包车和小店不支持电子支付；主流店铺支持 Alipay / Visa。' },
    { id: 'tip-3', title: '摄影装备建议', content: 'A7C2 + 20-70mm + CPL；Action5 pro 防水视频；DJI mini5 pro 航拍（注意科莫多国家公园禁飞区与申请流程）。' },
    { id: 'tip-4', title: '最佳拍摄时间', content: '粉色沙滩在正午直射光下最粉嫩；帕达尔岛徒步建议 08:30-10:00（侧逆光突出山脊肌理）；金巴兰日落 17:30-19:30。' },
    { id: 'tip-5', title: '包车避坑', content: '优先平台预订；微信/WhatsApp 提前沟通行程、费用、包含项目；留意油费、过路费、停车费、司机餐费是否包含。' },
    { id: 'tip-6', title: '海鲜一条街砍价', content: '目标价 180-250k IDR/公斤；每样当场确认价格；挑好鱼后盯住厨房防止调换。' },
    { id: 'tip-7', title: '安全注意', content: '乌鲁瓦图寺猴子抢手机墨镜；佩妮达日照极强；雅加达转机走国内出发厅；随身晕船药、肠胃药。' },
  ])
  console.log('   ✅ 小贴士模块')

  // 7. 准备工作详细文本（markdown）
  const prepModule = await createModule(token, guideId, '准备工作详解', 'text')
  await createModuleContent(token, prepModule.id, 'markdown', {
    text: buildPreparationText(),
  })
  console.log('   ✅ 准备工作详解模块')

  console.log(`\n🎉 攻略上传完成！攻略 ID: ${guideId}`)
  console.log(`   查看页面: ${BASE_URL}/guides/${guideId}`)
}

main().catch((err) => {
  console.error('❌ 执行失败:', err.message)
  process.exit(1)
})
