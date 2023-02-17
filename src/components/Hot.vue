<template>
  <div class="com-container">
    <div class="com-chart" ref="hot_ref"></div>
    <span :style="comStyle" class="iconfont arr-left" @click="toLeft">&#xe6ef;</span>
    <span :style="comStyle" class="iconfont arr-right" @click="toRight">&#xe6ed;</span>
    <span :style="comStyle" class="cat-name">{{catName}}</span>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import { getThemeValue } from '../utils/theme_utils'
  export default {
    name: 'Hot',
    data(){
      return {
        chartInstance: null,
        allData: null,          //从服务器中获取的所有数据
        currentIndex: 0,        //当前所展示的一级分类数据
        titleFontSize: 0
      }
    },
    created(){
      // 在组件创建完成的时候，进行回调函数的注册
      this.$socket.registerCallBack('hotproductData', this.getData)
    },
    mounted(){
      this.initCharts()
      // this.getData()
      // 向服务器发送数据，告诉服务器我现在需要数据
      this.$socket.send({
        action: "getData", 
        socketType: "hotproductData", 
        chartName: "hotproduct", 
        value: "" 
      })
      window.addEventListener('resize', this.screenAdapter)
      this.screenAdapter()
    },
    destroyed(){
      window.removeEventListener('resize', this.screenAdapter)
      // 在组件销毁的时候，进行回调函数的取消
      this.$socket.unRegisterCallBack('hotData')
    },
    computed: {
      catName(){
        if(!this.allData){
          return ''
        }else{
          return this.allData[this.currentIndex].name
        }
      },
      comStyle(){
        return {
          fontSize: this.titleFontSize + 'px',
          color: getThemeValue(this.theme).titleColor
        }
      },
      ...mapState(['theme'])
    },
    watch: {
      theme(){
        console.log('主题发生变化')
        // 销毁当前的图表
        this.chartInstance.dispose()
        // 重新以最新主题名称初始化图表
        this.initCharts()
        // 完成屏幕的适配
        this.screenAdapter()
        // 更新图表的数据
        this.updateChart()
      }
    },
    methods: {
      initCharts(){
        this.chartInstance = this.$echarts.init(this.$refs.hot_ref, this.theme)
        const initOption = {
          tooltip: {
            show: true,
            formatter: arg => {
              const thirdCategory = arg.data.children
              // 计算出所有三级分类的数值总和
              let total = 0
              thirdCategory.forEach(item => {
                total += item.value
              })
              let retStr = ''
              thirdCategory.forEach(item => {
                retStr += `
                  ${item.name}: ${parseInt(item.value/total * 100) + '%'}
                  <br/>
                `
              })
              return retStr
            }
          },
          title: {
            text: '▎热销商品的占比',
            left: 20,
            top: 20
          },
          legend: {
            icon: 'circle',
            top: '15%'
          },
          series: [
            {
              type: 'pie',
              label: {
                show: false
              },
              emphasis: {
                label: {
                  show: true
                },
                labelLine: {
                  show: false
                }
              }
            }
          ]
        }
        this.chartInstance.setOption(initOption)
      },
      getData(ret){
        // await this.$http.get()
        // const {data: ret} = await this.$http.get('hotproduct')
        this.allData = ret
        // 对allData进行赋值
        this.updateChart()
      },
      updateChart(){
        // 处理数据
        const seriesData = this.allData[this.currentIndex].children.map(item => {
          return {
            name: item.name,
            value: item.value,
            children: item.children
          }
        })
        const legendData = this.allData[this.currentIndex].children.map(item => {
          return item.name
        })
        const dataOption = {
          legend: {
            data: legendData
          },
          series: [
            {
              data: seriesData
            }
          ]
        }
        this.chartInstance.setOption(dataOption)
      },
      screenAdapter(){
        this.titleFontSize = this.$refs.hot_ref.offsetWidth / 100 * 3.6
        const adapterOption = {
          title: {
            textStyle: {
              fontSize: this.titleFontSize
            }
          },
          legend: {
            itemWidth: this.titleFontSize,
            itemHeight: this.titleFontSize,
            itemGap: this.titleFontSize / 2,
            textStyle: {
              fontSize: this.titleFontSize / 2
            }
          },
          series: [
            {
              radius: this.titleFontSize * 4.5,
              center: ['50%', '55%']
            }
          ]
        }
        this.chartInstance.setOption(adapterOption)
        this.chartInstance.resize()
      },
      toLeft(){
        this.currentIndex--
        if(this.currentIndex < 0){
          this.currentIndex = this.allData.length - 1
        }
        this.updateChart()
      },
      toRight(){
        this.currentIndex++
        if(this.currentIndex > this.allData.length - 1){
          this.currentIndex = 0
        }
        this.updateChart()
      }
    }
  }
</script>

<style lang="less" scoped>
  .arr-left{
    position: absolute;
    left: 10%;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: white;
  }
  .arr-right{
    position: absolute;
    right: 10%;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: white;
  }
  .cat-name{
    position: absolute;
    bottom: 20px;
    left: 80%;
    color: white;
  }
</style>