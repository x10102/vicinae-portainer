import {
	Action,
	ActionPanel,
	Color,
	Detail,
	Icon,
	List,
	showToast,
	Toast,
} from "@vicinae/api";

import { ContainerState, getContainers, IContainerInfo } from "./api";
import { useEffect, useState } from "react";

function containerStatusTag(container: IContainerInfo) {
	let color: Color = Color.PrimaryText;

	switch(container.State) {
		case ContainerState.Created: color = Color.Blue; break;
		case ContainerState.Running: color = Color.Green; break;
		case ContainerState.Restarting: color = Color.Orange; break;
		case ContainerState.Paused: color = Color.Orange; break;
		case ContainerState.Exited: color = Color.Red; break;
		case ContainerState.Dead: color = Color.Red; break;
	}

	return <Detail.Metadata.TagList.Item text={container.State} color={color}/>
}

export default function ListDetail() {

	const [containerData, setContainerData] = useState<IContainerInfo[]>([]);
	const [isLoading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			const loadingToast = await showToast({title: "Loading containers...", style: Toast.Style.Animated})

			try {
				const data = await getContainers();
				if(!cancelled) setContainerData(data);
				await loadingToast.hide();
			} catch(e) {
				console.error(e);
				loadingToast.style = Toast.Style.Failure
				loadingToast.title = `Failed to load containers (Check settings)`
			} finally {
				if(!cancelled) setLoading(false);
			}
		})();
		
		return () => {cancelled = true};
	}, [])

	return (
		<List isLoading={isLoading} isShowingDetail searchBarPlaceholder={"Search containers..."}>
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
									onAction={() =>
										showToast({ title: "Amogus" })
									}
								/>
								<Action
									title="Stop Container"
									icon={Icon.Stop}
									onAction={() =>
										showToast({ title: "Stopping" })
									}
								/>
								<Action
									title="Kill Container"
									icon={Icon.Stop}
									onAction={() => {
										getContainers()
										showToast({ title: "Force stopping" })
									}}
								/>
							</ActionPanel>
						}
					/>
				))}
			</List.Section>
		</List>
	);
}