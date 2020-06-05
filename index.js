/**
 * 文档链接：https://docs.chatie.io/v/zh/
 */

const {Wechaty} = require('wechaty')
const qrcode = require('qrcode-terminal')
const api = require('./common/api')


/************************  常量   ***************************/


const ROBOTNAME = '你的机器人微信号' // 机器人微信名
const ROOMNAME = '/^你的群名/i' //群名
const ADDFRIENDWORD = '/加群验证的关键词/i'//自动加好友填写的关键词
const ADDROOMWORD = '/私聊机器人的关键词/'

/***********************************************************/



// 实例化
var roomList = []

const bot = new Wechaty({name:'robot'})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)
bot.on('friendship', onFriendShip)
bot.on('room-join',onRoomJoin)

bot.start()
	.then(() => console.log('开始登陆微信'))
	.catch(e => console.error(e))



//  二维码生成
function onScan (code, status) {
	// 在console端显示二维码
	qrcode.generate(code, { small: true })

	// 打印二维码链接 可访问
  console.log(['https://api.qrserver.com/v1/create-qr-code/?data=',encodeURIComponent(code),].join(''))
}

// 登录
function onLogin (user) {
  console.log(`[登录]群助手 ${user.name()} 登录了`)
  roomList = await this.Room.findAll()
}

//登出
function onLogout(user) {
  console.log(`[登出]群助手 ${user.name()} 登出`)
  roomList = []
}

// 监听对话
async function onMessage (msg) {
	const contact = msg.from() // 发消息人
	const content = msg.text() //消息内容
	// 1.机器人自己发的消息
	if (msg.self()) return
	// 2.非群消息 且为个人发送
	if (contact.type() === bot.Contact.Type.Personal) { 
		// console.log(bot.Contact.Type.Official, bot.Contact.Type.Personal, bot.Contact.Type.Unknown); // 2 1 0
		console.log(`[消息源-个人], 发信人： ${contact.name()}, 消息内容: ${content}`)
		const room = roomList[parseInt(content)]
		let targetRoom = await this.Room.find({topic: room})
		if(targetRoom){
			try {
				let hasInRoom = await targetRoom.has(contact)
				console.log(`[存在判断]当前用户是否已在群里：${hasInRoom}`);
				if (hasInRoom) return
				// 40人以下的群，是直接拉用户进群的。 40人以上的群，是发送入群邀请链接的。
				await targetRoom.add(contact)
			} catch (e) {
				console.error(e)
			}
		}
	}
}

function sleep() {
	return new Promise(resolve => {
		setTimeout(() => {
				resolve(1)
		}, 1000)
	})
}
// 自动加好友功能
async function onFriendShip(friendship) {
  try {
		const contact = friendship.contact()
		console.log(`[好友申请]来自于：${contact.name()}`)

		await friendship.accept()
		console.log('[添加成功]')
		console.log('============================')
		await sleep()
		await contact.say(`哈喽~ ${contact.name()}<br>很高兴认识你<br>我是群管理小助手<br><br>加入【小程序交流群】, 请回复数字`)
	  	roomList.forEach(element, index => { 
			await contact.say(`${index} --- ${element}`)
		})
	  	await contact.say(`然后稍等几秒就能收到群邀请`)
  } catch (e) {
		console.log(e.message);
  }
}

// 加群提醒
function onRoomJoin(room, inviteeList, inviter) {
	console.log('---------')
  const nameList = inviteeList.map(c => c.name()).join(',')
  room.topic().then(function (res) {
		if(eval(ROOMNAME).test(res)){
			console.log(`[加群提醒] 群名： ${res} ，加入新成员： ${nameList}, 邀请人： ${inviter}`)
			room.say(`@${nameList} <br>🎉欢迎新朋友~~<br>🎉有什么问题都可以在群里提出哈~~`)
		}
  })
}

