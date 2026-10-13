import {
	Action,
	ActionPanel,
	Color,
	getPreferenceValues,
	Icon,
	KeyEquivalent,
	List,
	showToast,
	Toast,
} from "@vicinae/api";

interface extensionPrefs {
	"api-url": string;
	"api-user": string;
	"api-password": string;
};

const prefs = getPreferenceValues<extensionPrefs>();

export default function ListDetail() {
	return (
		<List isShowingDetail searchBarPlaceholder={"Search containers..."}>
			<List.Section title={"Containers"}>
				{fruits.map((fruit) => (
					<List.Item
						key={fruit.emoji}
						title={fruit.name}
						icon={fruit.emoji}
						detail={
							<List.Item.Detail
								markdown={fruit.description}
								metadata={
									<List.Item.Detail.Metadata>
										<List.Item.Detail.Metadata.Label
											title="API URL"
											text={prefs["api-url"]}
										/>
										<List.Item.Detail.Metadata.Label
											title="API User"
											text={prefs["api-user"]}
										/>
										<List.Item.Detail.Metadata.Label
											title="API Pass"
											text={prefs["api-password"]}
										/>
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
									onAction={() =>
										showToast({ title: "Force stopping" })
									}
								/>
							</ActionPanel>
						}
					/>
				))}
			</List.Section>
		</List>
	);
}

type Fruit = {
	emoji: string;
	name: string;
	color: Color;
	description: string; // Markdown formatted description
};

export const fruits: Fruit[] = [
	{
		emoji: "🐳",
		name: "Some container",
		color: Color.Blue,
		description:
			'Ayo this is a container',
	}
];
