require('normalize.css/normalize.css');
require('styles/App.css');


import React from 'react';

//获取图片相关数据
let imageDatas = require('../data/imageDatas.json');

//利用自执行函数，将图片名信息转成图片URL路径信息
imageDatas = (function getImageURL(imagesDatasArr){
  for(var i=0,j=imagesDatasArr.length;i<j;i++){
    var singleImageData = imagesDatasArr[i];
    singleImageData.imageURL = require('../images/'+singleImageData.fileName);
    imagesDatasArr[i] = singleImageData;
  }
  return imagesDatasArr;
})(imageDatas);

//获取区间内的一个随机值
function getRangeRandom(low,high){
  return Math.ceil(Math.random()*(high-low) + low);
}
//限制旋转角度在0-30以内,正负都可以
function get30DegRandom(){
  return ((Math.random()>0.5 ? '':'-')+Math.ceil(Math.random()*30));
}
//单幅画组件 旧方式
let ImageFigure = React.createClass({
  //imgFigure的点击处理函数
  handleClick:function(e){
    if(this.props.arrange.isCenter){
      this.props.inverse();
    }else{
      this.props.center();
    }
    e.stopPropagation();
    e.preventDefault();
  },
  render:function(){
    let styleObj={};
    //如果props属性中指定了这张图片的位置，则使用
    if(this.props.arrange.pos){
      styleObj = this.props.arrange.pos;
    }
    //如果图片的旋转角度有值
    if(this.props.arrange.rotate){
      (['MozTransform','msTransform','WebkitTransform','']).forEach(function(value){
        styleObj[value] = 'rotate('+this.props.arrange.rotate+'deg)';
      }.bind(this))
    }
    //调整居中图片不被其他图片遮挡
    if(this.props.arrange.isCenter){
      styleObj.zIndex = 11;
    }
    let imgFigureClassName = 'img-figure';
    imgFigureClassName += this.props.arrange.isInverse ? ' is-inverse' :'';

    return (
      <figure className={imgFigureClassName} style={styleObj} onClick={this.handleClick}>
        <img src={this.props.data.imageURL} alt={this.props.data.title}/>
        <figcaption>
          <h2 className="img-title">{this.props.data.title}</h2>
          <div className="img-back" onClick={this.handleClick}>
            <p>
              {this.props.data.desc}
            </p>
          </div>
        </figcaption>
      </figure>
    )
  }
});
//控制组件  es6方式定义组件
class ControllerUnit extends React.Component{
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this); //注意需要将handleClick 绑定到this ，不然在函数中this = null !!!
  }

  handleClick(e){
    //如果点击是当前正在选中态的按钮，则翻转图片，否则将对应的图片居中
    if(this.props.arrange.isCenter){
      this.props.inverse();
    }else{
      this.props.center();
    }
    e.stopPropagation();
    e.preventDefault();
  }

  render(){
    let controllerUnitClassName = 'controll-unit';
    //如果对应的是居中的图片，显示控制按钮的居中态
    if(this.props.arrange.isCenter){
      controllerUnitClassName+=' is-center';
      //如果同时对应的是翻转图片，显示控制按钮的翻转态
      if(this.props.arrange.isInverse){
        controllerUnitClassName+=' is-inverse';
      }
    }
    return (
      <span className={controllerUnitClassName} onClick={this.handleClick}></span>
    );
  }
}

class AppComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imgsArrangeArr:[
        /*{
          pos:{
            left:0,
            top:0
          },
          rotate:0, //旋转角度
          isInverse:false // 图片正反面
          isCenter:false// 图片是否居中

        }*/
      ],//初始化图片状态
      //图片排布的可取值范围常量
	  Constant:{
	    centerPos:{
	      left:0,
	      top:0
	    },
	    hPosRange:{//水平方向的取值范围
	      leftSecX:[0,0], //左分区X取值范围
	      rightSecX:[0,0], //右分区X取值范围
	      y:[0,0]  //y范围
	    },
	    vPosRange:{   //垂直方向的取值范围
	      x:[0,0],
	      topY:[0,0]
	    }
	  }
    };
    // this.inverse = this.inverse.bind(this);
    // this.rearrange = this.rearrange.bind(this);
    // this.center = this.center.bind(this);
  }

  //翻转图片
  //@param index 输入当前被执行inverse操作的图片对应的信息数组index
  //@return {Function} 这是一个闭包函数，其内return 一个真正被执行的函数
  inverse(index){
    return function(){
      var imgsArrangeArr = this.state.imgsArrangeArr;
      imgsArrangeArr[index].isInverse = !imgsArrangeArr[index].isInverse;
      this.setState({ // 设置状态，重新渲染
        imgsArrangeArr : imgsArrangeArr
      })
    }.bind(this);
  }
  
  //重新布局所有图片
  //param:centerIndex,指定居中的图片索引
  rearrange(centerIndex){
    let imgsArrangeArr = this.state.imgsArrangeArr,
				        Constant = this.state.Constant,
				        centerPos = Constant.centerPos,
				        hPosRange = Constant.hPosRange,
				        vPosRange = Constant.vPosRange,
				        hPosRangeLeftSecX = hPosRange.leftSecX,
				        hPosRangeRightSecX = hPosRange.rightSecX,
				        hPosRangeY = hPosRange.y,
				        vPosRangeTopY = vPosRange.topY,
				        vPosRangeX = vPosRange.x,

				        imgsArrangeTopArr = [],//存储上侧图片信息
				        topImgNum = Math.floor(Math.random() *2), //上侧图片数量随机 0 1
				        topImgSpliceIndex = 0,//标记上侧图片是从数组的哪个取出
				        imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex,1);//居中图片信息

        //首先居中centerIndex图片
        imgsArrangeCenterArr[0] = {
          pos:centerPos,
          rotate:0,
          isCenter:true
        }

        //居中图片不需要旋转
        imgsArrangeArr[0].rotate = 0;
        //取出要布局上侧图片的状态信息
        topImgSpliceIndex = Math.ceil(Math.random()*(imgsArrangeArr.length - topImgNum));
        imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex,topImgNum);

        //布局位于上侧的图片
        imgsArrangeTopArr.forEach(function(value,index){
          imgsArrangeTopArr[index] = {
            pos : {
              top:getRangeRandom(vPosRangeTopY[0],vPosRangeTopY[1]),
              left:getRangeRandom(vPosRangeX[0],vPosRangeX[1])
            },
            rotate:get30DegRandom(),
            isCenter:false
          }
        });

        //布局左右两侧图片
        for(var i=0,j =imgsArrangeArr.length,k=j/2;i<j;i++){
          let hPosRangeLORX = null;//临时变量

          //前半部分布局左侧，后半部分布局右侧
          if(i<k){
            hPosRangeLORX = hPosRangeLeftSecX;
          }else{
            hPosRangeLORX = hPosRangeRightSecX;
          }
          imgsArrangeArr[i]={
            pos :{
              top:getRangeRandom(hPosRangeY[0],hPosRangeY[1]),
              left:getRangeRandom(hPosRangeLORX[0],hPosRangeLORX[1])
            },
            rotate:get30DegRandom(),
            isCenter:false
          };
        }

        if(imgsArrangeTopArr && imgsArrangeArr[0]){ //表示取出了一个值
          imgsArrangeArr.splice(topImgSpliceIndex,0,imgsArrangeTopArr[0]);//把剔除的上侧图片重新加回数组中
        }

        imgsArrangeArr.splice(centerIndex,0,imgsArrangeCenterArr[0]);//把中心位置的图片加回数组中
      
      //设置状态,触发Component的重新渲染
      this.setState({
        imgsArrangeArr : imgsArrangeArr
      })
  }

 //利用rearrange函數，居中对应index图片
 //param  index 需要被居中的图片对应的图片信息数组的index
 //return {Function}
 center(index){
  return function(){
    this.rearrange(index);
  }.bind(this);
 }
 
  //组件加载以后，为每张图片计算其位置的范围
  componentDidMount(){
    //得到舞台大小
    let stageDOM = this.refs.stage,
        stageW = stageDOM.scrollWidth,
        stageH = stageDOM.scrollHeight,
        halfStageW = Math.ceil(stageW/2),
        halfStageH = Math.ceil(stageH/2);
        //拿到一个imageFigure大小
        let imageFigureDOM = this.refs['imgFigure0'].getElementsByTagName('figure')[0],
            imageW = imageFigureDOM.scrollWidth,
            imageH = imageFigureDOM.scrollHeight,
            halfImgW = Math.ceil(imageW/2),
            halfImgH = Math.ceil(imageH/2);
        //计算中心图片的位置点
        this.state.Constant.centerPos = {
          left:halfStageW - halfImgW,
          top:halfStageH - halfImgH
        }
        //左右区域范围
        this.state.Constant.hPosRange.leftSecX[0] = -halfImgW;
        this.state.Constant.hPosRange.leftSecX[1] = halfStageW - halfImgW*3;
        this.state.Constant.hPosRange.rightSecX[0] = halfStageW + halfImgW;
        this.state.Constant.hPosRange.rightSecX[1] = stageW - halfImgW;
        this.state.Constant.hPosRange.y[0] = -halfImgH;
        this.state.Constant.hPosRange.y[1] = stageH - halfImgH;

        //上侧区域
        this.state.Constant.vPosRange.topY[0] = -halfImgH;
        this.state.Constant.vPosRange.topY[1] = halfStageH - halfImgH*3;
        this.state.Constant.vPosRange.x[0] = halfStageW - imageW;
        this.state.Constant.vPosRange.x[1] = halfStageW;
        this.rearrange(0);
   }
   
  render() {
    let controllerUnits = [],
        imgFigures = [];
    
    imageDatas.forEach(function(value,index){
      if(!this.state.imgsArrangeArr[index]){
        this.state.imgsArrangeArr[index] = {
          pos:{
            left:0,
            top:0
          },
          rotate:0,
          isInverse:false,
          isCenter:false
        }
      }
      imgFigures.push(<div key={index} ref={'imgFigure'+index}><ImageFigure  data={value}  arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}/></div>);//注意key!!!!  传递位置信息
      //注意：直接在ImageFigure上设置ref ，this.refs获得的是这个组件实例，需要在外面加一层div并设置ref才能获取到这个真实的节点 !!!
      
      controllerUnits.push(<ControllerUnit key={index} arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}></ControllerUnit>);
    }.bind(this));//绑定到ReactComponent
    return (
      <section className="stage" ref="stage">
        <section className="img-sec">
          {imgFigures}
        </section>
        <nav className="controller-nav">
          {controllerUnits}
        </nav>
      </section>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;