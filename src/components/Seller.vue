<template>
  <div class="com-container">
    <div class="com-chart" ref="seller_ref"></div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    name: 'Seller',
    data(){
      return {
        chartInstance: null,
        allData: null,        //服务器返回的数据
        currentPage: 1,       //当前显示的页数
        totalPage: 0,         //一共显示多少页          
        timeId: null,         //定时器标识
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
      this.$socket.registerCallBack('sellerData', this.getData)
    },
    mounted(){
      this.initCharts()
      // this.getData()
      // 向服务器发送数据，告诉服务器我现在需要数据
      this.$socket.send({
        action: "getData", 
        socketType: "sellerData", 
        chartName: "seller", 
        value: "" 
      })
      // 监听浏览器窗口大小的变化，对柱状图的大小样式进行分辨率的适配
      window.addEventListener('resize', this.screenAdapter)
      // 一开始进入页面的时候，就需要主动对屏幕进行适配大小
      this.screenAdapter()
    },
    destroyed(){
      // 清除循环定时器
      clearInterval(this.timeId)
      // 组件销毁的时候，需要取消监听器
      window.removeEventListener('resize', this.screenAdapter)
      // 在组件销毁的时候，进行回调函数的取消
      this.$socket.unRegisterCallBack('sellerData')
    },
    methods: {
      // 初始化echartsInstance对象
      initCharts(){
        this.chartInstance = this.$echarts.init(this.$refs.seller_ref, this.theme)
        // 对图表初始化配置的控制
        const initOption = {
          title: {
            text: '▎商家销售统计',
            left: 20,
            top: 20,
          },
          grid: {
            // 通过设置上下左右距离容器的距离，来设置网格的大小
            top: '20%',
            left: '3%',
            right: '6%',
            bottom: '3%',
            containLabel: true    //grid设置的区域包含坐标轴上的文字
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'line',
              z: 0,   //调整层级
              lineStyle: {
                color: '#2D3443'
              }
            }
          },
          xAxis: {
            type: 'value'
          },
          yAxis: {
            type: 'category',
          },
          series: [
            {
              type: 'bar',
              label: {
                show: true,
                position: 'right',
                textStyle: {
                  color: 'white'
                }
              },
              itemStyle: {
                // 使用echarts内置的渐变色生成器echarts.graphic.LinearGradient
                // 指明颜色渐变的方向
                // 指明不同百分比下颜色的值
                color: new echarts.graphic.LinearGradient(
                  0, 0, 1, 0, 
                  [
                    {offset: 0, color: '#5052EE'},
                    {offset: 1, color: '#AB6EE5'}
                  ]
                )
              }
            }
          ]
        }
        this.chartInstance.setOption(initOption)
        // 鼠标移入图表，关闭定时器
        this.chartInstance.on('mouseover', () => {
          clearInterval(this.timeId)
        })
        // 鼠标移出图表，开启定时器
        this.chartInstance.on('mouseout', () => {
          this.startInterval()
        })
      },

      // 获取服务器的数据，ret就是服务端发送给客户端的图表数据
      getData(ret){
        // 结构出data，并且data赋值给ret
        // const {data: ret} = await this.$http.get('seller')
        this.allData = ret
        this.allData.sort((a,b) => {
          return a.value - b.value
        })
        // 每五个元素显示一页
        this.totalPage = this.allData.length % 5 === 0 ? this.allData.length/5 : this.allData.length/5 + 1
        this.updateChart()
        this.startInterval()   //启动定时器
      },

      // 更新图表
      updateChart(){
        const start = (this.currentPage - 1) * 5
        const end = this.currentPage * 5
        const showData = this.allData.slice(start, end)
        const sellerName = showData.map(item => {
          return item.name
        })
        const sellerValue = showData.map(item => {
          return item.value
        })
        const dataOption = {
          yAxis: {
            data: sellerName
          },
          series: [
            {
              data: sellerValue,
            }
          ]
        }
        // setOption是可以设置多次的，新旧option不是覆盖，而是相互整合的过程
        this.chartInstance.setOption(dataOption)
      },

      startInterval(){
        if(this.timeId){
          clearInterval(this.timeId)
        }
        this.timeId = setInterval(() => {
          this.currentPage++
          if(this.currentPage > this.totalPage){
            this.currentPage = 1
          }
          this.updateChart()
        }, 5000)
      },

      // 当浏览器的大小发生变化的时候，会调用的方法，来完成屏幕的适配
      screenAdapter(){
        // 获取图标容器的宽度
        // 容器大小设置的width和height都是100%，所以浏览器大小变化，容器大小也会变化
        const width = this.$refs.seller_ref.offsetWidth
        // titleFontSize大小就是自己根据容器的大小，试出来的一个字体大小
        const titleFontSize = width / 100 * 3.6
        // 下面的大小都是和屏幕大小相关的一些配置
        const adapterOption = {
          title: {
            textStyle: {
              fontSize: titleFontSize
            }
          },
          tooltip: {
            axisPointer: {
              lineStyle: {
                width: titleFontSize
              }
            }
          },
          series: [
            {
              barWidth: titleFontSize,
              itemStyle: {
                barBorderRadius: [0, titleFontSize/2, titleFontSize/2, 0],
              }
            }
          ]
        }
        this.chartInstance.setOption(adapterOption)
        // 屏幕大小发生变化，必须手动的调用图表对象的resize方法，才能产生效果
        this.chartInstance.resize()
      }
    }
  }
</script>

<style lang="less" scoped>

</style>