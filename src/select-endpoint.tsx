import {
	Action,
	ActionPanel,
	Color,
	Detail,
	Icon,
	List,
	LocalStorage,
	showToast,
	Toast,
	useNavigation,
} from "@vicinae/api";
import { useEffect, useState } from "react";
import { getEnvironments } from "./api";
import type { IEndpointInfo } from "./api-types";
import { EnvironmentStatus, EnvironmentType } from "./api-types";

function getEndpointStatusTag(e: IEndpointInfo) {
	switch (e.Status) {
		case EnvironmentStatus.Up:
			return <Detail.Metadata.TagList.Item text={"Up"} color={Color.Green} />;
		case EnvironmentStatus.Down:
			return <Detail.Metadata.TagList.Item text={"Down"} color={Color.Red} />;
	}
}

function getEndpointTypeStr(e: IEndpointInfo): string {
	switch (e.Type) {
		case EnvironmentType.DockerLocal:
			return "Local Docker Environment";
		case EnvironmentType.Agent:
			return "Agent Environment";
		case EnvironmentType.EdgeAgent:
			return "Edge Agent Environment";
		case EnvironmentType.Azure:
			return "Azure Environment";
		case EnvironmentType.KubernetesLocal:
			return "Local Kubernetes Environment";
	}
}

export default function SelectEndpoint() {
	const [endpointData, setEndpointData] = useState<IEndpointInfo[]>([]);
	const [isLoading, setLoading] = useState<boolean>(true);
	const { pop } = useNavigation();

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			const loadingToast = await showToast({
				title: "Loading endpoints...",
				style: Toast.Style.Animated,
			});

			try {
				const data = await getEnvironments();
				if (!cancelled) setEndpointData(data.data);
				await loadingToast.hide();
			} catch (e) {
				console.error(e);
				loadingToast.style = Toast.Style.Failure;
				loadingToast.title = `Failed to load endpoints (Check settings)`;
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		loadData().catch((e) => console.error(e));

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<List
			isLoading={isLoading}
			isShowingDetail
			searchBarPlaceholder={"Search endpoints..."}
		>
			<List.Section title={"Endpoints"}>
				{endpointData.map((endpoint, idx) => (
					<List.Item
						key={`endpoint-${idx}`}
						title={endpoint.Name}
						detail={
							<List.Item.Detail
								metadata={
									<List.Item.Detail.Metadata>
										<Detail.Metadata.Label
											title="Endpoint ID"
											text={endpoint.Id.toString()}
										/>
										<Detail.Metadata.TagList title="Status">
											{getEndpointStatusTag(endpoint)}
										</Detail.Metadata.TagList>
										<Detail.Metadata.Label
											title="Environment type"
											text={getEndpointTypeStr(endpoint)}
										/>
										<Detail.Metadata.Label
											title="Container engine"
											text={endpoint.ContainerEngine ?? "unknown"}
										/>
									</List.Item.Detail.Metadata>
								}
							/>
						}
						actions={
							<ActionPanel>
								<Action
									title="Select endpoint"
									icon={Icon.Check}
									onAction={() => {
										LocalStorage.setItem("portainer-endpoint", endpoint.Id);
										showToast({ title: `Selected endpoint: ${endpoint.Name}` });
										pop();
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
