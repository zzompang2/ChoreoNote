import React from 'react';
import {
	View, Text, TouchableOpacity, FlatList, TextInput, Animated, Switch
} from 'react-native';
import getStyleSheet, { COLORS, getDancerColors } from '../values/styles';
import IconIonicons from 'react-native-vector-icons/Ionicons';

const TAG = "DancerScreen/";

export default class DancerScreen extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isAddBtnAppear: false
		}

		this.btnWidth = new Animated.Value(70);
		this.btnScale = new Animated.Value(0);
		this.deleteBtnAnim = [];
		this.screenTop = new Animated.Value(1);

		for(let i=0; i<this.props.dancers.length; i++)
		this.deleteBtnAnim.push([ new Animated.Value(10), new Animated.Value(0) ]);
	}

	controlAddButton = () => {
		const { isAddBtnAppear } = this.state;

		if(!isAddBtnAppear) {
			Animated.spring(
				this.btnWidth, {
					toValue: 330,
					friction: 5,
					tension: 100,
					useNativeDriver: false
			}).start();
			Animated.timing(
				this.btnScale, {
					toValue: 1,
					duration: 700,
					delay: 200,
					useNativeDriver: true
				}
			).start();
		}

		else {
			Animated.timing(
				this.btnScale, {
					toValue: 0,
					duration: 1,
					useNativeDriver: true
				}
			).start();
			Animated.spring(
				this.btnWidth, {
					toValue: 70,
					friction: 10,
					tension: 70,
					useNativeDriver: false
			}).start();
		}

		this.setState({ isAddBtnAppear: !isAddBtnAppear });
	}

	addDancer = (colorIdx) => {
		this.props.addDancer(colorIdx);
		this.deleteBtnAnim.push([ new Animated.Value(10), new Animated.Value(0) ]);
	}

	deleteDancer = (did) => {
		// 처음으로 클릭 된 경우
		if(this.deleteEnable != did) {
			this.deleteButtonDisable();

			this.deleteEnable = did;
			Animated.timing(
				this.deleteBtnAnim[this.deleteEnable][0], {
					toValue: 40,
					duration: 600,
					useNativeDriver: false
				}
			).start();
			Animated.timing(
				this.deleteBtnAnim[this.deleteEnable][1], {
					toValue: 1,
					duration: 600,
					useNativeDriver: false
				}
			).start();
		}
		// 두 번째로 클릭 된 경우: delete
		else {
			// 버튼 애니메이션 초기화 & Animated 요소 하나 삭제
			this.deleteButtonDisable();
			this.deleteBtnAnim.pop();

			this.props.deleteDancer(did);
		}
	}

	deleteButtonDisable = () => {
		if(this.deleteEnable != undefined) {
			Animated.timing(
				this.deleteBtnAnim[this.deleteEnable][0], {
					toValue: 10,
					duration: 600,
					useNativeDriver: false
				}
			).start();
			Animated.timing(
				this.deleteBtnAnim[this.deleteEnable][1], {
					toValue: 0,
					duration: 600,
					useNativeDriver: false
				}
			).start();
			this.deleteEnable = undefined;
		}
	}

	// <FlatList> 구분선
	listViewItemSeparator = () => 
	<View style={getStyleSheet().itemSeparator} />
	
	componentDidMount() {
		Animated.timing(
			this.screenTop, {
				toValue: 0,
				duration: 500,
				useNativeDriver: false,
			}
		).start();
	}

	render() {
		const { nid, displayName, dancers, changeName, changeColor } = this.props;
		const {
			controlAddButton,
			addDancer,
			deleteDancer,
			deleteButtonDisable,
			listViewItemSeparator,
		} = this;
		const styles = getStyleSheet();
		const dancerColors = getDancerColors();

		const addBtnContainerStyle = { width: this.btnWidth };
		const addBtnStyle = { transform: [{ scale: this.btnScale }]};
		const screenTopStyle = { top: this.screenTop.interpolate({
			inputRange: [0, 1],
			outputRange: ['0%', '100%']
		})};

		deleteButtonDisable();

		return(
			<View style={{position: 'absolute', width: '100%', height: '100%', justifyContent: 'flex-end'}}>
				<Animated.View style={[screenTopStyle, {flex: 1, backgroundColor: COLORS.blackMiddle}]}>
					{/* Navigation Bar */}
					<View style={[styles.navigationBar, {borderTopLeftRadius: 30, borderTopRightRadius: 30}]}>
						<View style={{flexDirection: 'row', alignItems: 'center'}}>
							<TouchableOpacity onPress={() =>
								Animated.timing(
									this.screenTop, {
										toValue: 1,
										duration: 250,
										useNativeDriver: false,
									}
								).start(() => this.props.setDancerScreen(false))}>
								<IconIonicons name="chevron-back" size={20} style={styles.navigationBar__button} />
							</TouchableOpacity>
							<Text style={styles.navigationBar__title}>Dancer</Text>
						</View>
					</View>

					{listViewItemSeparator()}

					{/* Dancer 리스트 */}
					<FlatList
					initialNumToRender={15}
					style={styles.noteList}
					data={dancers}
					keyExtractor={(item, idx) => idx.toString()}
					ItemSeparatorComponent={listViewItemSeparator}
					renderItem={({ item, index }) =>
					<View>
						<View style={styles.dancerEntry}>
							<TouchableOpacity
							onPress={() => changeColor(item.did)}
							style={{...styles.dancerEntry__color, backgroundColor: dancerColors[item.color]}}>
								<Text style={styles.dancerEntry__text}>
									{displayName ? item.name.slice(0, 2) : item.did+1}
								</Text>
							</TouchableOpacity>
							<TextInput
							maxLength={30}
							style={{...styles.dancerEntry__input}}
							placeholder="Please input dancer name."
							onEndEditing={e => changeName(e.nativeEvent.text, item.did)}
							autoCorrect={false}>
								{item.name}
							</TextInput>
							<TouchableOpacity
							onPress={() => deleteDancer(item.did)}
							style={styles.dancerEntry__btn}>
								<Animated.View style={[
									styles.dancerEntry__btnIcon, 
									{
										height: this.deleteBtnAnim[item.did][0],
										width: Animated.add(12, Animated.multiply(-1/5, this.deleteBtnAnim[item.did][0])),
										backgroundColor: this.deleteBtnAnim[item.did][1].interpolate({
											inputRange: [0, 1],
											outputRange: [COLORS.blackDark, COLORS.white]
										}),
										transform: [{
											rotate: this.deleteBtnAnim[item.did][1].interpolate({
												inputRange: [0, 1],
												outputRange: ['0deg', '45deg']
											})
										}]
									}
								]} />
								<Animated.View style={[
									styles.dancerEntry__btnIcon, 
									{
										width: this.deleteBtnAnim[item.did][0],
										height: Animated.add(12, Animated.multiply(-1/5, this.deleteBtnAnim[item.did][0])),
										backgroundColor: this.deleteBtnAnim[item.did][1].interpolate({
											inputRange: [0, 1],
											outputRange: [COLORS.blackDark, COLORS.white]
										}),
										transform: [{
											rotate: this.deleteBtnAnim[item.did][1].interpolate({
												inputRange: [0, 1],
												outputRange: ['0deg', '45deg']
											})
										}
									]}
								]} />
							</TouchableOpacity>
						</View>
						{/* 맨 마지막 entry 에만 여백 공간을 둔다. 버튼에 가려지지 않게 하기 위해 */}
						{index == dancers.length-1 ? <View style={{height: 120}} /> : null}
					</View>
					} />

					{/* Add 버튼 */}
					<View>
						<Animated.View style={[styles.dancerAddBtnContainer, addBtnContainerStyle]}>
							{dancerColors.map((color, idx) => 
							<TouchableOpacity 
							key={idx}
							style={[styles.dancerAddBtn, {backgroundColor: color}, addBtnStyle]}
							onPress={() => addDancer(idx)}/>)}
							<TouchableOpacity
							style={styles.dancerControlBtn}
							onPress={controlAddButton} />
						</Animated.View>
					</View>
				</Animated.View>
			</View>
		)
	}
}