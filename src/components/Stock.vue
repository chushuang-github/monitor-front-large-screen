<template>
  <div class="com-container">
    <div class="com-chart" ref="stock_ref"></div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    name: 'Stock',
    data(){
      return {
        chartInstance: null,
        allData: null,          //从服务器中获取的所有数据
        currentIndex: 0,        //当前显示的数据页数
        timeId: null
      }
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
    created(){
      // 在组件创建完成的时候，进行回调函数的注册
      this.$socket.registerCallBack('stockData', this.getData)
    },
    mounted(){
      this.initCharts()
      // this.getData()
      // 向服务器发送数据，告诉服务器我现在需要数据
      this.$socket.send({
        action: "getData", 
        socketType: "stockData", 
        chartName: "stock", 
        value: "" 
      })
      window.addEventListener('resize', this.screenAdapter)
      this.screenAdapter()
    },
    destroyed(){
      window.removeEventListener('resize', this.screenAdapter)
      clearInterval(this.timeId)
      // 在组件销毁的时候，进行回调函数的取消
      this.$socket.unRegisterCallBack('stockData')
    },
    methods: {
      initCharts(){
        this.chartInstance = this.$echarts.init(this.$refs.stock_ref, this.theme)
        const initOption = {
          title: {
            text: '▎库存和销量分析',
            left: 20,
            top: 20
          }
        }
        this.chartInstance.setOption(initOption)
        this.chartInstance.on('mouseover', () => {
          clearInterval(this.timeId)
        })
        this.chartInstance.on('mouseout', () => {
          this.startInterval()
        })
      },
      getData(ret){
        // await this.$http.get()
        // const {data: ret} = await this.$http.get('stock')
        this.allData = ret
        // 对allData进行赋值
        this.updateChart()
        this.startInterval()
      },
      updateChart(){
        // 每一个饼图中心点坐标
        const centerArr = [
          ['18%', '40%'], 
          ['50%', '40%'],
          ['82%', '40%'], 
          ['34%', '75%'], 
          ['66%', '75%']
        ]
        // 增加5个圆环的渐变颜色范围 
        const colorArrs = [ 
          ['#4FF778', '#0BA82C'], 
          ['#E5DD45', '#E8B11C'], 
          ['#E8821C', '#E55445'], 
          ['#5052EE', '#AB6EE5'], 
          ['#23E5E5', '#2E72BF']
        ]
        // 处理数据
        const start = this.currentIndex * 5
        const end = (this.currentIndex + 1) * 5
        const showData = this.allData.slice(start, end)
        const seriesArr = showData.map((item, index) => {
          return {
            type: 'pie',
            center: centerArr[index],
            hoverAnimation: false,
            labelLine: {
              show: false
            },
            label: {
              position: 'center',
              color: colorArrs[index][0]
            },
            data: [
              { 
                name: item.name + '\n\n' + item.sales, 
                value: item.sales,
                itemStyle: {
                  color: new this.$echarts.graphic.LinearGradient(
                    0, 1, 0, 0, 
                    [
                      {offset: 0, color: colorArrs[index][0]},
                      {offset: 1, color: colorArrs[index][1]}
                    ]
                  )
                } 
              },
              { 
                value: item.stock,
                itemStyle: {
                  color: '#333843'
                }
              }
            ]
          }
        })
        const dataOption = {
          series: seriesArr
        }
        this.chartInstance.setOption(dataOption)
      },
      screenAdapter(){
        const titleFontSize = this.$refs.stock_ref.offsetWidth / 100 * 3.6
        const innerRaidus = titleFontSize * 2.8
        const outterRadius = innerRaidus * 1.125
        const adapterOption = {
          title: {
            textStyle: {
              fontSize: titleFontSize
            }
          },
          series: [
            {
              type: 'pie',
              radius: [outterRadius, innerRaidus],
              label: {
                fontSize: titleFontSize / 2
              }
            },
            {
              type: 'pie',
              radius: [outterRadius, innerRaidus],
              label: {
                fontSize: titleFontSize / 2
              }
            },
            {
              type: 'pie',
              radius: [outterRadius, innerRaidus],
              label: {
                fontSize: titleFontSize / 2 
              }
            },
            {
              type: 'pie',
              radius: [outterRadius, innerRaidus],
              label: {
                fontSize:titleFontSize / 2
              }
            },
            {
              type: 'pie',
              radius: [outterRadius, innerRaidus],
              label: {
                fontSize: titleFontSize / 2
              }
            }
          ]
        }
        this.chartInstance.setOption(adapterOption)
        this.chartInstance.resize()
      },
      startInterval(){
        if(this.timeId){
          clearInterval(this.timeId)
        }
        this.timeId = setInterval(() => {
          this.currentIndex++
          if(this.currentIndex > 1){
            this.currentIndex = 0
          }
          this.updateChart()
        }, 5000)
      }
    }
  }
</script>

<style lang="less" scoped>

</style>