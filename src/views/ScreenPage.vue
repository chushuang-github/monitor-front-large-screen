<template>
  <div class="screen-container" :style="containerStyle">
    <header class="screen-header">
      <div>
        <img :src="headerSrc" alt="">
      </div>
      <span class="logo">
        <img :src="logoSrc" alt="" />
      </span>
      <span class="title">电商平台实时监控系统</span>
      <div class="title-right">
        <img @click="handleChangeTheme" :src="themeSrc" class="qiehuan">
        <span class="datetime">2049-01-01 00:00:00</span>
      </div>
    </header>
    <div class="screen-body">
      <section class="screen-left">
        <div id="left-top" :class="{fullscreen: fullScreenStatus.trend}">
          <!-- 销量趋势图表 -->
          <Trend ref="trend"></Trend>
          <div class="resize">
            <span @click="changeSize('trend')" :class="['iconfont', fullScreenStatus.trend ? 'icon-compress-alt':'icon-expand-alt']"></span>
          </div>
        </div>
        <div id="left-bottom" :class="{fullscreen: fullScreenStatus.seller}">
          <!-- 商家销售金额图表 -->
          <Seller ref="seller"></Seller>
          <div class="resize">
            <span @click="changeSize('seller')" :class="['iconfont', fullScreenStatus.seller ? 'icon-compress-alt':'icon-expand-alt']"></span>
          </div>
        </div>
      </section>
      <section class="screen-middle">
        <div id="middle-top" :class="{fullscreen: fullScreenStatus.map}">
          <!-- 商家分布图表 -->
          <Map ref="map"></Map>
          <div class="resize">
            <span @click="changeSize('map')" :class="['iconfont', fullScreenStatus.map ? 'icon-compress-alt':'icon-expand-alt']"></span>
          </div>
        </div>
        <div id="middle-bottom" :class="{fullscreen: fullScreenStatus.rank}">
          <!-- 地区销量排行图表 -->
          <Rank ref="rank"></Rank>
          <div class="resize">
            <span @click="changeSize('rank')" :class="['iconfont', fullScreenStatus.rank ? 'icon-compress-alt':'icon-expand-alt']"></span>
          </div>
        </div>
      </section>
      <section class="screen-right">
        <div id="right-top" :class="{fullscreen: fullScreenStatus.hotproduct}">
          <!-- 热销商品占比图表 -->
          <Hot ref="hotproduct"></Hot>
          <div class="resize">
            <span @click="changeSize('hotproduct')" :class="['iconfont', fullScreenStatus.hotproduct ? 'icon-compress-alt':'icon-expand-alt']"></span>
          </div>
        </div>
        <div id="right-bottom" :class="{fullscreen: fullScreenStatus.stock}">
          <!-- 库存销量分析图表 -->
          <Stock ref="stock"></Stock>
          <div class="resize">
            <span @click="changeSize('stock')" :class="['iconfont', fullScreenStatus.stock ? 'icon-compress-alt':'icon-expand-alt']"></span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import Hot from '@/components/Hot.vue'
import Map from '@/components/Map.vue'
import Rank from '@/components/Rank.vue'
import Seller from '@/components/Seller.vue'
import Stock from '@/components/Stock.vue'
import Trend from '@/components/Trend.vue'
import { mapState } from 'vuex'
import { getThemeValue } from '../utils/theme_utils'
export default {
  name: 'ScreenPage',
  data(){
    return {
      fullScreenStatus: {      //全屏每一个图表状态的数据
        trend: false, 
        seller: false, 
        map: false, 
        rank: false, 
        hotproduct: false, 
        stock: false
      }
    }
  },
  computed: {
    ...mapState(['theme']),
    logoSrc(){
      return '/static/img/' + getThemeValue(this.theme).logoSrc
    },
    headerSrc(){
      return '/static/img/' + getThemeValue(this.theme).headerBorderSrc
    },
    themeSrc(){
      return '/static/img/' + getThemeValue(this.theme).themeSrc
    },
    containerStyle(){
      return {
        backgroundColor: getThemeValue(this.theme).backgroundColor,
        color: getThemeValue(this.theme).titleColor
      }
    }
  },
  components: {
    Hot,
    Map,
    Rank,
    Seller,
    Stock,
    Trend
  },
  created(){
    // 进行回调函数的注册
    this.$socket.registerCallBack('fullScreen', this.recvData)
    this.$socket.registerCallBack('themeChange', this.recvThemeChange)
  },
  destroyed(){
    this.$socket.unRegisterCallBack('fullScreen')
    this.$socket.unRegisterCallBack('themeChange')
  },
  methods: {
    changeSize(chartName){
      // 下面的1 和 2 步骤是实现单个突表的全屏效果
      // 1、改变fullScreenStatus的数据
      // this.fullScreenStatus[chartName] = !this.fullScreenStatus[chartName]
      // 2、需要调用每一个图表组件的方法(调用组件中的screenAdapter方法，这个方法会根据外界最新容器的方法更新图表大小)
      // 数据发生变化，不能立即让dom元素发生更新，screenAdapter方法必须是在dom元素大小发生变化的时候调用才有效
      // nextTick方法可以让回调函数延迟到下次dom元素更新完成之后再执行
      // this.$nextTick(() => {
      //   this.$refs[chartName].screenAdapter()
      // })
      // 将要变成的目标状态，变成全屏还是非全屏
      const targetValue = !this.fullScreenStatus[chartName]
      // 将数据发生给服务端
      this.$socket.send({
        action: 'fullScreen',
        socketType: 'fullScreen',
        chartName: chartName,
        value: targetValue
      })
    },
    // 注册接收到数据的回调函数
    recvData(data){
      // 取出是哪一个图表要切换
      const chartName = data.chartName
      // 取出切换成什么状态
      const value = data.value
      this.fullScreenStatus[chartName] = value
      this.$nextTick(() => {
        this.$refs[chartName].screenAdapter()
      })
    },
    handleChangeTheme(){
      // 修改vuex中的数据
      // this.$store.commit('changeTheme')
      this.$socket.send({
        action: 'themeChange',
        socketType: 'themeChange',
        chartName: '',
        value: ''
      })
    },
    recvThemeChange(){
      this.$store.commit('changeTheme')
    }
  }
}
</script>
<style lang="less" scoped>
// 全屏样式的定义
.fullscreen {
  position: fixed!important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  z-index: 100;
}

.screen-container {
  width: 100%;
  height: 100%;
  padding: 0 20px;
  background-color: #161522;
  color: #fff;
  box-sizing: border-box;
}
.screen-header {
  width: 100%;
  height: 64px;
  font-size: 20px;
  position: relative;
  > div {
      img {
        width: 100%;
      }
    }
  .title {
    position: absolute;
    left: 50%;
    top: 50%;
    font-size: 20px;
    transform: translate(-50%, -50%);
  }
  .title-right {
    display: flex;
    align-items: center;
    position:absolute;
    right: 0px;
    top: 50%;
    transform: translateY(-80%);
  }
  .qiehuan {
    width: 28px;
    height: 21px;
    cursor: pointer;
  }
  .datetime {
    font-size: 15px;
    margin-left: 10px;
  }
  .logo {
    position: absolute;
    left: 0px;
    top: 50%;
    transform: translateY(-80%);
    img {
      height: 35px;
      width: 128px;
    }
  }
}
.screen-body {
  width: 100%;
  height: 100%;
  display: flex;
  margin-top: 10px;
  .screen-left {
    height: 100%;
    width: 27.6%;
    #left-top {
      height: 53%;
      position: relative;
    }
    #left-bottom {
      height: 31%;
      margin-top: 25px;
      position: relative;
    }
  }
  .screen-middle {
    height: 100%;
    width: 41.5%;
    margin-left: 1.6%;
    margin-right: 1.6%;
    #middle-top {
      width: 100%;
      height: 56%;
      position: relative;
    }
    #middle-bottom {
      margin-top: 25px;
      width: 100%;
      height: 28%;
      position: relative;
    }
  }
  .screen-right {
    height: 100%;
    width: 27.6%;
    #right-top {
      height: 46%;
      position: relative;
    }
    #right-bottom {
      height: 38%;
      margin-top: 25px;
      position: relative;
    }
  }
}
.resize {
  position: absolute;
  right: 20px;
  top: 20px;
  cursor: pointer;
}
</style>
