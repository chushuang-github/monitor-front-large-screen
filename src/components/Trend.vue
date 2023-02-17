<template>
  <div class="com-container">  
    <div class="title" :style="comStyle">
      <span>{{ '▎' + showTitle }}</span>
      <span class="iconfont title-icon" :style="comStyle" @click="showChoice=!showChoice">&#xe6eb;</span>
      <div :style="marginStyle"  v-show="showChoice">
        <div class="select-item" v-for="item in selectType" :key="item.key" @click="handleSelect(item.key)">
          {{item.text}}
        </div>
      </div>
    </div>
    <div class="com-chart" ref="trend_ref">
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import { getThemeValue } from '../utils/theme_utils'
  export default {
    name: 'Trend',
    data(){
      return {
        chartInstance: null,
        allData: null,          //从服务器中获取的所有数据
        showChoice: false,      //是否显示可选项的div
        choiceType: 'map',      //显示数据类型
        titleFontSize: 0        //字体大小的数据
      }
    },
    created(){
      // 在组件创建完成的时候，进行回调函数的注册
      this.$socket.registerCallBack('trendData', this.getData)
    },
    mounted(){
      this.initCharts()
      // this.getData()
      // 向服务器发送数据，告诉服务器我现在需要数据
      this.$socket.send({
        action: "getData", 
        socketType: "trendData", 
        chartName: "trend", 
        value: "" 
      })
      window.addEventListener('resize', this.screenAdapter)
      this.screenAdapter()
    },
    destroyed(){
      window.removeEventListener('resize', this.screenAdapter)
      // 在组件销毁的时候，进行回调函数的取消
      this.$socket.unRegisterCallBack('trendData')
    },
    computed: {
      selectType(){
        if(!this.allData){
          return []
        }else{
          return this.allData.type.filter(item => {
            return item.key !== this.choiceType
          })
        }
      },
      showTitle(){
        if(!this.allData){
          return ''
        }else{
          return this.allData[this.choiceType].title
        }
      },
      // 设置给标题的样式
      comStyle(){
        return {
          fontSize: this.titleFontSize + 'px',
          color: getThemeValue(this.theme).titleColor
        }
      },
      marginStyle(){
        return {
          marginLeft: this.titleFontSize/2 + 'px',
          backgroundColor: getThemeValue(this.theme).backgroundColor
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
        this.chartInstance = this.$echarts.init(this.$refs.trend_ref, this.theme)
        const initOption = {
          legend: {
            left: 20,
            top: '15%',
            icon: 'circle'
          },
          tooltip: {
            trigger: 'axis'
          },
          grid: {
            left: '3%',
            top: '35%',
            right: '4%',
            bottom: '1%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false
          },
          yAxis: {
            type: 'value'
          }
        }
        this.chartInstance.setOption(initOption)
      },
      getData(ret){
        // await this.$http.get() 获取数据
        // const {data: ret} = await this.$http.get('trend')
        this.allData = ret
        // 对allData进行赋值
        this.updateChart()
      },
      updateChart(){
        // 半透明的颜色值 
        const colorArr1 = [ 
          'rgba(11, 168, 44, 0.5)', 
          'rgba(44, 110, 255, 0.5)', 
          'rgba(22, 242, 217, 0.5)', 
          'rgba(254, 33, 30, 0.5)', 
          'rgba(250, 105, 0, 0.5)' 
        ]
        // 全透明的颜色值 
        const colorArr2 = [ 
          'rgba(11, 168, 44, 0)', 
          'rgba(44, 110, 255, 0)', 
          'rgba(22, 242, 217, 0)', 
          'rgba(254, 33, 30, 0)', 
          'rgba(250, 105, 0, 0)' 
        ]
        // 处理数据
        // 类目轴的数据
        const timeArr = this.allData.common.month
        // y轴数据
        const valueArr = this.allData[this.choiceType].data
        const seriesArr = valueArr.map((item,index) => {
          return {
            name: item.name,
            type: 'line',
            data: item.data,
            stack: this.choiceType,
            areaStyle: {
              color: new this.$echarts.graphic.LinearGradient(
                0, 0, 0, 1 ,
                [
                  {offset: 0, color: colorArr1[index]},
                  {offset: 1, color: colorArr2[index]}
                ]
              )
            }
          }
        })
        // 图例的数据
        const legendArr = valueArr.map(item => {
          return item.name
        })
        const dataOption = {
          legend: {
            data: legendArr
          },
          xAxis: {
            data: timeArr
          },
          series: seriesArr
        }
        this.chartInstance.setOption(dataOption)
      },
      screenAdapter(){
        this.titleFontSize = this.$refs.trend_ref.offsetWidth / 100 * 3.6
        const adapterOption = {
          legend: {
            itemWidth: this.titleFontSize,
            itemHeight: this.titleFontSize,
            itemGap: this.titleFontSize,
            textStyle: {
              fontSize: this.titleFontSize / 2
            }
          }
        }
        this.chartInstance.setOption(adapterOption)
        this.chartInstance.resize()
      },
      handleSelect(currentType){
        this.choiceType = currentType
        this.updateChart()
        this.showChoice = false
      }
    }
  }
</script>

<style lang="less" scoped>
  .title{
    position: absolute;
    left: 20px;
    top: 20px;
    z-index: 10;
    color: white;
    .title-icon{
      margin-left: 10px;
      cursor: pointer;
    }
    .select-item { 
      cursor: pointer; 
    }
  }
</style>