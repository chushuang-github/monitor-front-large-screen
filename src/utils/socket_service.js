export default class SocketService {
  // 单例的设计模式：只有别人通过get Instance调用得到的都是同一个实例对象
  static instance = null
  // 类中的get Instance方法，在调用的时候不用加()的
  // 因为是静态方法，所以直接通过类名调用
  // 调用：SocketService.Instance 就可以直接调用了
  static get Instance(){
    if(!this.instance){
      this.instance = new SocketService()
    }
    return this.instance
  }
  // 和服务端连接的socket对象
  // 直接写一个属性=某一个值，这个属性是直接存在这个类的实例身上的
  ws = null
  // 存储回调函数
  callBackMapping = {}

  // 表示是否连接成功了
  connected = false
  // 记录重试的次数
  sendRetryCount = 0

  // 服务器重新连接尝试的次数
  connectRetryCount = 0

  // 定义一个连接服务器的方法
  connect(){
    if(!window.WebSocket){
      return console.log('你的浏览器不支持WebSocket')
    }
    this.ws = new WebSocket('ws://localhost:9998')
    // 监听连接服务端成功
    this.ws.onopen = () => {
      this.connected = true
      // 服务器连接成功，将服务器重新连接尝试的次数这个变量改为0
      this.connectRetryCount = 0
      console.log('连接服务端成功')
    }
    // 监听连接服务端失败
    // 连接服务器失败 和 连接成功之后服务器关闭，这两种情况都会执行此方法
    this.ws.onclose = () => {
      this.connected = false
      this.connectRetryCount++
      console.log('连接服务端失败')
      // 断开服务器之后，有一个自动重连的机制
      setTimeout(() => {
        this.connect()
      }, this.connectRetryCount * 500)
    }
    // 监听接收到服务端的数据
    // msg是服务器所传过来的数据，我们需要将数据传递给每一个组件
    // 通过回调函数的形式，传递给每一个组件
    this.ws.onmessage = msg => {
      console.log('从服务端获取到了数据')
      // 真正服务端发送过来的原始数据是在msg.data中的
      const recvData = JSON.parse(msg.data)
      const socketType = recvData.socketType
      // 判断回调函数是否存在
      if(this.callBackMapping[socketType]){
        const action = recvData.action
        if(action === 'getData'){
          const realData = JSON.parse(recvData.data)
          this.callBackMapping[socketType].call(this, realData)
        }else if(action === 'fullScreen'){
          this.callBackMapping[socketType].call(this, recvData)
        }else if(action === 'themeChange') {
          this.callBackMapping[socketType].call(this, recvData)
        }
      }
    }
  }
  // 回调函数的注册 (在组件中调用)
  registerCallBack(socketType, callback){
    this.callBackMapping[socketType] = callback
  }
  // 取消某一个回调函数 (在组件中调用)
  unRegisterCallBack(socketType){
    this.callBackMapping[socketType] = null
  }
  // 定义一个发送数据的方法 (在组件中调用)
  send(data){
    // web sockets只能通过连接发送纯文本数据，所以对于复杂的数据结构，在通过连接发送之前，必须进行序列化
    // 因为socket服务器连接需要一点的时间，所以我们使用一个延时定时器
    // 下面写法可以
    // setTimeout(() => {
    //   if(this.ws.readyState === 1){
    //     this.ws.send(JSON.stringify(data))
    //   }
    // }, 50)
    // 判断此时有没有连接成功
    if(this.connected){
      this.sendRetryCount = 0
      this.ws.send(JSON.stringify(data))
    }else{
      this.sendRetryCount++
      setTimeout(() => {
        this.ws.send(JSON.stringify(data))
      }, this.sendRetryCount * 500)
    }
  }
}