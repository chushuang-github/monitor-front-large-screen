import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store' 
import axios from 'axios'

// 引入连接socket服务器的类
import SocketService from './utils/socket_service'

// 引入全局的样式文件
import './assets/css/global.less'
// 引入字体图标
import './assets/font/iconfont.css'

// 对服务端数据的websocket的连接
// 类中定义的时候，是通过 static get Instance(){} 定义的
// 静态方法，又加了get，调用的时候是不需要加小括号的
SocketService.Instance.connect()

// 将SocketService挂载到vue的原型上面 (组件中this.$socket就是类SocketService的实例)
Vue.prototype.$socket = SocketService.Instance

// 将全局的echarts对象，挂载到vue的原型对象上
Vue.prototype.$echarts = window.echarts

// 将axios挂载到Vue的原型对象上 
axios.defaults.baseURL = 'http://127.0.0.1:8888/api/'
Vue.prototype.$http = axios

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
