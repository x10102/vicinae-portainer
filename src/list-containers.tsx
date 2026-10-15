import {
	Action,
	ActionPanel,
	Color,
	Detail,
	Icon,
	List,
	showToast,
	Toast,
	showHUD,
	confirmAlert,
	PopToRootType,
	popToRoot,
} from "@vicinae/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { getContainers, startContainer, stopContainer } from "./api";
import { ContainerState, type IContainerInfo } from "./api-types";

async function handleContainerStop(container: IContainerInfo) {
	await showToast({
			title: "Stopping container",
			style: Toast.Style.Animated,
		})
	if(await confirmAlert({title: "Confirm action", message: "The container will be stopped, continue?"})) {
		await stopContainer(container)
		.then((res) => {
			console.log(res);
			showToast({
				title: res.message,
				style: res.isError
					? Toast.Style.Failure
					: Toast.Style.Success,
			});
			showHUD("Container stopped", {popToRootType: PopToRootType.Immediate})
			// Call popToRoot too after showHUD because showHUD only pops to root when the window is opened again
			// the API polling would be running in the background the entire time
			// not sure if this is a Vicinae bug or just me using it wrong
			void popToRoot({clearSearchBar: true});	
		});
	} else {
		showToast({
			title: "Action canceled",
			style: Toast.Style.Failure
		})
	}
}

async function handleContainerStart(container: IContainerInfo) {
	await showToast({
		title: "Starting container",
		style: Toast.Style.Animated,
	})
	if(await confirmAlert({title: "Confirm action", message: "The container will be started, continue?"})) {
		await startContainer(container)
		.then((res) => {
			console.log(res);
			showToast({
				title: res.message,
				style: res.isError
					? Toast.Style.Failure
					: Toast.Style.Success,
			});
			if(!res.isError) {
				showHUD("Container started", {popToRootType: PopToRootType.Immediate})
				void popToRoot({clearSearchBar: true})
			}
		});
	} else {
		showToast({
			title: "Action canceled",
			style: Toast.Style.Failure
		})
	}
}

function makeStartStopAction(container: IContainerInfo) {
	if (container.State === ContainerState.Running) {
		return (
			<>
				<Action
					title="Stop Container"
					icon={Icon.Stop}
					onAction={() => handleContainerStop(container)}
				/>
				<Action
					title="Kill Container"
					icon={Icon.Stop}
					onAction={async () => {
						showToast({ title: "Force stopping" });
					}}
				/>
			</>
		);
	} else {
		return (
			<Action
				title="Start Container"
				icon={Icon.Play}
				onAction={() => handleContainerStart(container)}
			/>
		);
	}
}

function containerStatusTag(container: IContainerInfo) {
	let color: Color = Color.PrimaryText;

	switch (container.State) {
		case ContainerState.Created:
			color = Color.Blue;
			break;
		case ContainerState.Running:
			color = Color.Green;
			break;
		case ContainerState.Restarting:
			color = Color.Orange;
			break;
		case ContainerState.Paused:
			color = Color.Orange;
			break;
		case ContainerState.Exited:
			color = Color.Red;
			break;
		case ContainerState.Dead:
			color = Color.Red;
			break;
	}

	return <Detail.Metadata.TagList.Item text={container.State} color={color} />;
}

export default function ListDetail() {
	const [containerData, setContainerData] = useState<IContainerInfo[]>([]);
	const [isLoading, setLoading] = useState<boolean>(true);
	const [refresh, forceRefresh] = useState<boolean>(true);
	const errorShown = useRef(false);

	useEffect(() => {
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const loadData = async () => {
			try {
				const data = await getContainers();
				errorShown.current = false;
				if (!cancelled) setContainerData(data.data);
			} catch (e) {
				console.error(e);
				if(!cancelled && !errorShown.current) {
					errorShown.current = true;
					await showToast({
						title: `Failed to load containers (Check settings)`,
						style: Toast.Style.Failure
					});
				}
				
			} finally {
				if (!cancelled) {
					setLoading(false);
					timer = setTimeout(() => void loadData(), 1500);
				}
			}
		};

		loadData().catch((e) => console.error(e));

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, []);

	return (
		<List
			isLoading={isLoading}
			isShowingDetail
			searchBarPlaceholder={"Search containers..."}
		>
			<List.Section title={"Containers"}>
				{containerData.map((container, idx) => (
					<List.Item
						key={`container-${idx}`}
						title={container.Names[0].slice(1)}
						detail={
							<List.Item.Detail
								markdown={container.Id}
								metadata={
									<List.Item.Detail.Metadata>
										<Detail.Metadata.TagList title="Status">
											{containerStatusTag(container)}
										</Detail.Metadata.TagList>
									</List.Item.Detail.Metadata>
								}
							/>
						}
						actions={
							<ActionPanel>
								<Action
									title="View logs"
									icon={Icon.Logstash}
									onAction={() => showToast({ title: "Amogus" })}
								/>
								{makeStartStopAction(container)}
							</ActionPanel>
						}
					/>
				))}
			</List.Section>
		</List>
	);
}
