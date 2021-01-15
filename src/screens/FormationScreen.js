import React from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity
} from 'react-native';
import SQLite from "react-native-sqlite-storage";
import getStyleSheet from '../values/styles';
import Stage from '../components/Stage';
import Timeline from '../components/Timeline';

const db = SQLite.openDatabase({ name: 'ChoreoNote.db' });

export default class FormationScreen extends React.Component {

	state = {
		noteInfo: undefined,
		dancers: [],
		times: [],
		positions: [],
		curTime: 0
	}

	setDancerPosition = (did, newX, newY) => {
		const { noteInfo: { nid }, times, positions, curTime } = this.state;
		let newPositions;

		let time;
		for(let i = 0; i < times.length; i++) {
			time = times[i];
			if(time.time <= curTime && curTime < time.time + time.duration)
				break;
		}
		for(let i = 0; i < positions.length; i++) {
			if(positions[i].time == time.time && positions[i].did == did) {
				newPositions = [...positions.slice(0, i), {...positions[i], x: newX, y: newY}, ...positions.slice(i+1)];
				break;
			}
		}
		this.setState({ positions: newPositions });

		db.transaction(txn => {
			txn.executeSql(
				"UPDATE positions " +
				"SET x=?, y=? " +
				"WHERE nid=? AND time=? AND did=?",
				[newX, newY, nid, time.time, did],
				() => console.log("DB SUCCESS"),
				e => console.log("DB ERROR", e));
		});
	}

	setCurTime = (time) => {
		const { noteInfo: { musicLength }} = this.state;
		if(time < 0 || musicLength <= time)
			return;

		this.setState({ curTime: time });
	}

	componentDidMount() {
		const nid = this.props.route.params.nid;

		db.transaction(txn => {
      txn.executeSql(
				"SELECT * FROM notes WHERE nid = ?",
				[nid],
        (txn, result) => {
					const noteInfo = result.rows.item(0);
					txn.executeSql(
						"SELECT * FROM dancers WHERE nid = ?",
						[nid],
						(txn, result) => {
							const dancers = [];
							for (let i = 0; i < result.rows.length; i++)
								dancers.push({...result.rows.item(i), key: i});
							txn.executeSql(
								"SELECT * FROM times WHERE nid = ?",
								[nid],
								(txn, result) => {
									const times = [];
									for (let i = 0; i < result.rows.length; i++)
										times.push({...result.rows.item(i), key: i});
									txn.executeSql(
										"SELECT * FROM positions WHERE nid = ?",
										[nid],
										(txn, result) => {
											const positions = [];
											for (let i = 0; i < result.rows.length; i++)
												positions.push({...result.rows.item(i), key: i});
											console.log(noteInfo);
											this.setState({ noteInfo, dancers, times, positions });
										}
									);
								}
							);
						}
					);
				}
			);
		},
		e => console.log("DB ERROR", e),
		() => console.log("DB SUCCESS"));
	}

	render() {
		const { noteInfo, dancers, times, positions, curTime } = this.state;
		const styles = getStyleSheet();
		const { 
			setDancerPosition,
			setCurTime
		} = this;

		if(noteInfo === undefined)
			return null;

		return(
			<View style={styles.bg}>
			<SafeAreaView style={styles.bg}>
				{/* Tool Bar */}
				<View style={styles.toolbar}>
					<Text numberOfLines={1} style={styles.toolbarTitle}>{noteInfo.title}</Text>
					<TouchableOpacity onPress={() => this.props.navigation.goBack()}>
						<Text style={styles.toolbarButton}>뒤로</Text>
					</TouchableOpacity>
				</View>

				{/* Stage: Coordinate & Dancer */}
				<Stage
				stageRatio={noteInfo.stageRatio}
				dancers={dancers}
				times={times}
				positions={positions}
				curTime={curTime}
				setDancerPosition={setDancerPosition} />

				{/* Music Bar */}

				{/* Timeline */}
				<Timeline
				musicLength={noteInfo.musicLength}
				dancers={dancers}
				times={times}
				positions={positions}
				curTime={curTime}
				setCurTime={setCurTime} />

			</SafeAreaView>
			</View>
		)
	}
}