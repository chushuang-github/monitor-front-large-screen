<template>
  <div class="com-container">
    <div class="com-chart" ref="rank_ref"></div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    name: 'Rank',
    data(){
      return {
        chartInstance: null,
        allData: null,          //从服务器中获取的所有数据
        startValue: 0,          //区域缩放的起点值
        endValue: 9,            //区域缩放的终点值
        timeId: null,           //定时器id
      }
    },
    created(){
      // 在组件创建完成的时候，进行回调函数的注册
      this.$socket.registerCallBack('rankData', this.getData)
    },
    computed: {
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
    mounted(){
      this.initCharts()
      // this.getData()
      // 向服务器发送数据，告诉服务器我现在需要数据
      this.$socket.send({
        action: "getData", 
        socketType: "rankData", 
        chartName: "rank", 
        value: "" 
      })
      window.addEventListener('resize', this.screenAdapter)
      this.screenAdapter()
    },
    destroyed(){
      window.removeEventListener('resize', this.screenAdapter)
      clearInterval(this.timeId)
      // 在组件销毁的时候，进行回调函数的取消
      this.$socket.unRegisterCallBack('rankData')
    },
    methods: {
      initCharts(){
        this.chartInstance = this.$echarts.init(this.$refs.rank_ref, this.theme)
        const initOption = {
          tooltip: {
            show: true
          },
          title: {
            text: '▎地区销售排行',
            left: 20, 
            top: 20
          },
          grid: {
            top: '40%',
            left: '5%',
            right: '5%',
            bottom: '5%',
            containLabel: true
          },
          xAxis: {
            type: 'category'
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              type: 'bar'
            }
          ]
        }
        this.chartInstance.setOption(initOption)
        // 鼠标移入，关闭定时器；鼠标移除，开启定时器
        this.chartInstance.on('mouseover', () => {
          clearInterval(this.timeId)
        })
        this.chartInstance.on('mouseout', () => {
          this.startInteval()
        })
      },
      getData(ret){
        // await this.$http.get()
        // const {data: ret} = await this.$http.get('rank')
        this.allData = ret
        // 数据从大到小进行排序
        this.allData = this.allData.sort((a, b) => {
          return b.value - a.value
        })
        // 对allData进行赋值
        this.updateChart()
        this.startInteval()
      },
      updateChart(){
        // 处理图表需要的数据 
        const colorArr = [ 
          ['#0BA82C', '#4FF778'], 
          ['#2E72BF', '#23E5E5'], 
          ['#5052EE', '#AB6EE5'] 
        ]
        // x轴数据，省份
        const provinceArr = this.allData.map(item => {
          return item.name
        })
        // y轴数据，销售金额
        const valueArr = this.allData.map(item => {
          return item.value
        })
        // 处理数据
        const dataOption = {
          xAxis: {
            data: provinceArr
          },
          dataZoom: {
            show: false,
            startValue: this.startValue,
            endValue: this.endValue
          },
          series: [
            {
              data: valueArr,
              itemStyle: {
                color: arg => {
                  let targetColorArr = null
                  if(arg.value > 300){
                    targetColorArr = colorArr[0]
                  }else if(arg.value > 200){
                    targetColorArr = colorArr[1]
                  }else{
                    targetColorArr = colorArr[2]
                  }
                  return new this.$echarts.graphic.LinearGradient(
                    0, 0, 0, 1,
                    [
                      {offset: 0, color: targetColorArr[0]},
                      {offset: 1, color: targetColorArr[1]}
                    ]
                  )
                }
              }
            }
          ]
        }
        this.chartInstance.setOption(dataOption)
      },
      screenAdapter(){
        const titleFontSize = this.$refs.rank_ref.offsetWidth / 100 * 3.6
        const adapterOption = {
          title: {
            textStyle: {
              fontSize: titleFontSize
            }
          },
          series: [
            {
              barWidth: titleFontSize,
              itemStyle: {
                barBorderRadius: [titleFontSize/2, titleFontSize/2, 0, 0]
              }
            }
          ]
        }
        this.chartInstance.setOption(adapterOption)
        this.chartInstance.resize()
      },
      startInteval(){
        if(this.timeId){
          clearInterval(this.timeId)
        }
        this.timeId = setInterval(() => {
          this.startValue++
          this.endValue++
          if(this.endValue > this.allData.length - 1){
            this.startValue = 0
            this.endValue = 9
          }
          this.updateChart()
        }, 2000)
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>