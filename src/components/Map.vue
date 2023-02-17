<template>
  <div class="com-container" @dblclick="revertMap">
    <div class="com-chart" ref="map_ref"></div>
  </div>
</template>

<script>
  import axios from 'axios'
  import {getProvinceMapInfo} from '../utils/map_utils'
  import { mapState } from 'vuex'
  export default {
    name: 'Map',
    data(){
      return {
        chartInstance: null,
        allData: null,       //从服务器中获取的所有数据
        mapData: {}          //所获取的省份的地图矢量数据
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
      this.$socket.registerCallBack('mapData', this.getData)
    },
    mounted(){
      this.initCharts()
      // this.getData()
      // 向服务器发送数据，告诉服务器我现在需要数据
      this.$socket.send({
        action: "getData", 
        socketType: "mapData", 
        chartName: "map", 
        value: "" 
      })
      window.addEventListener('resize', this.screenAdapter)
      this.screenAdapter()
    },
    destroyed(){
      window.removeEventListener('resize', this.screenAdapter)
      // 在组件销毁的时候，进行回调函数的取消
      this.$socket.unRegisterCallBack('mapData')
    },
    methods: {
      async initCharts(){
        this.chartInstance = this.$echarts.init(this.$refs.map_ref, this.theme)
        // 由于我们获取的地图矢量数据并不是位于koa服务器的后台，所以不能使用this.$http.get()发送请求
        const ret = await axios.get('http://localhost:8999/static/map/china.json')
        this.$echarts.registerMap('china', ret.data)
        const initOption = {
          title: {
            text: '▎商家分布',
            left: 20,
            top: 20
          },
          geo: {
            type: 'map',
            map: 'china',
            top: '5%',
            bottom: '5%',
            itemStyle: {
              areaColor: '#2E72BF',
              borderColor: '#333333'
            }
          },
          legend: {
            left: '5%',
            bottom: '5%',
            orient: 'vertical'
          }
        }
        this.chartInstance.setOption(initOption)
        this.chartInstance.on('click', async (arg) => {
          // arg.name 得到所点击的省份名字，是中文，
          // getProvinceMapInfo这个工具函数，可以将英文转化为英文
          const provinceInfo = getProvinceMapInfo(arg.name)
          // 判断当前所点击的省份地图矢量数据在mapData中是否存在
          // 不存在时才发送请求
          if(!this.mapData[provinceInfo.key]){
            // 获取省份的地图矢量数据
            const {data: ret} = await axios.get(`http://localhost:8999${provinceInfo.path}`)
            this.mapData[provinceInfo.key] = ret 
            this.$echarts.registerMap(provinceInfo.key, ret)
          }    
          const changeOption = {
            geo: {
              map: provinceInfo.key
            }
          }
          this.chartInstance.setOption(changeOption)
        })
      },
       getData(ret){
        // 获取散点图数据
        // const {data: ret} = await this.$http.get('map')
        this.allData = ret
        // 对allData进行赋值
        this.updateChart()
      },
      updateChart(){
        // 图例的数据
        const legendArr = this.allData.map(item => {
          return item.name
        })
        const seriesArr = this.allData.map(item => {
          // 每一个对象代表一个类别的多个散点
          // 如果想在地图上显示散点的数据，所以我们需要给散点的图表添加一个配置coordinateSysten配置
          // 将使用地图的坐标系统
          return {
            type: 'effectScatter',
            name: item.name,
            data: item.children,
            coordinateSystem: 'geo',
            rippleEffect: { 
              scale: 5,
              brushType: 'stroke'
            }
          }
        })
        // 处理数据
        const dataOption = {
          legend: {
            data: legendArr
          },
          series: seriesArr
        }
        this.chartInstance.setOption(dataOption)
      },
      screenAdapter(){
        const titleFontSize = this.$refs.map_ref.offsetWidth / 100 * 3.6
        const adapterOption = {
          title: {
            textStyle: {
              fontSize: titleFontSize
            }
          },
          legend: {
            itemWidth: titleFontSize / 2,
            itemHeight: titleFontSize / 2,
            itemGap: titleFontSize / 2, 
            textStyle: {
              fontSize: titleFontSize / 2
            }
          }
        }
        this.chartInstance.setOption(adapterOption)
        this.chartInstance.resize()
      },
      // 回到中国地图
      revertMap(){
        const revertOption = {
          geo: {
            map: 'china'
          }
        }
        this.chartInstance.setOption(revertOption)
      }
    }
  }
</script>

<style lang="less" scoped>

</style>