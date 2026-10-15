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
} from "@vicinae/api";
import { useCallback, useEffect, useState } from "react";
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
			showHUD("Container started", {popToRootType: PopToRootType.Immediate})
		});
	} else {
		showToast({
			title: "Action canceled",
			style: Toast.Style.Failure
		})
	}
}

function makeStartStopAction(container: IContainerInfo, refresh: () => void) {
	if (container.State === ContainerState.Running) {
		return (
			<>
				<Action
					title="Stop Container"
					icon={Icon.Stop}
					onAction={() => handleContainerStop(container)
									.then(() => {refresh()})
					}
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
				onAction={() => { handleContainerStart(container)
									.then(() => {refresh()})
				}}
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
	const [isLoading, setLoading] = useState(true);
	const [refresh, forceRefresh] = useState(true);
	const useRefresh = useCallback(() => forceRefresh(!refresh), []);

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			const loadingToast = await showToast({
				title: "Loading containers...",
				style: Toast.Style.Animated,
			});

			try {
				const data = await getContainers();
				if (!cancelled) setContainerData(data.data);
				await loadingToast.hide();
			} catch (e) {
				console.error(e);
				loadingToast.style = Toast.Style.Failure;
				loadingToast.title = `Failed to load containers (Check settings)`;
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		loadData().catch((e) => console.error(e));

		return () => {
			cancelled = true;
		};
	}, [refresh]);

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
								{makeStartStopAction(container, useRefresh)}
							</ActionPanel>
						}
					/>
				))}
			</List.Section>
		</List>
	);
}
