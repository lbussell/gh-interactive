import { Spinner, TextInput } from "@inkjs/ui";
import { Box, Text, useFocus, useInput } from "ink";
import { useCallback, useRef, useState } from "react";

export type FormField =
	| {
			type: "text";
			id: string;
			label: string;
			placeholder?: string;
			defaultValue?: string;
	  }
	| {
			type: "checkbox";
			id: string;
			label: string;
			defaultValue?: boolean;
	  };

type FormProps = {
	fields: FormField[];
	onSubmit: (values: Record<string, string | boolean>) => void;
	onCancel: () => void;
	submitLabel?: string;
	error?: string | null;
	submitting?: boolean;
};

type FormValues = Record<string, string | boolean>;

function TextField({
	field,
	onChange,
	autoFocus,
}: {
	field: Extract<FormField, { type: "text" }>;
	onChange: (v: string) => void;
	autoFocus?: boolean;
}) {
	const { isFocused } = useFocus({ id: field.id, autoFocus });

	// Stabilize onChange so TextInput's internal useEffect doesn't loop
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const stableOnChange = useCallback((v: string) => {
		onChangeRef.current(v);
	}, []);

	return (
		<Box gap={1}>
			<Text color={isFocused ? "blue" : undefined}>
				{isFocused ? ">" : " "} {field.label}:
			</Text>
			<TextInput
				isDisabled={!isFocused}
				placeholder={field.placeholder}
				defaultValue={field.defaultValue}
				onChange={stableOnChange}
			/>
		</Box>
	);
}

function CheckboxField({
	field,
	value,
	onChange,
	autoFocus,
}: {
	field: Extract<FormField, { type: "checkbox" }>;
	value: boolean;
	onChange: (v: boolean) => void;
	autoFocus?: boolean;
}) {
	const { isFocused } = useFocus({ id: field.id, autoFocus });

	useInput(
		(_input, key) => {
			if (key.return || _input === " ") {
				onChange(!value);
			}
		},
		{ isActive: isFocused },
	);

	const checkmark = value ? "✓" : " ";

	return (
		<Box gap={1}>
			<Text color={isFocused ? "blue" : undefined}>
				{isFocused ? ">" : " "} {field.label}:
			</Text>
			<Text color={isFocused ? "blue" : undefined}>[{checkmark}]</Text>
		</Box>
	);
}

function SubmitButton({
	label,
	submitting,
	onSubmit,
}: {
	label: string;
	submitting: boolean;
	onSubmit: () => void;
}) {
	const { isFocused } = useFocus({ id: "__submit__" });

	useInput(
		(_input, key) => {
			if (key.return && !submitting) {
				onSubmit();
			}
		},
		{ isActive: isFocused },
	);

	if (submitting) {
		return (
			<Box gap={1}>
				<Text> </Text>
				<Spinner label={`${label}...`} />
			</Box>
		);
	}

	return (
		<Box gap={1}>
			<Text color={isFocused ? "blue" : undefined}>
				{isFocused ? ">" : " "} [{label}]
			</Text>
		</Box>
	);
}

export function Form({
	fields,
	onSubmit,
	submitLabel = "Submit",
	error,
	submitting = false,
}: FormProps) {
	const [values, setValues] = useState<FormValues>(() => {
		const initial: FormValues = {};
		for (const field of fields) {
			if (field.type === "text") {
				initial[field.id] = field.defaultValue ?? "";
			} else if (field.type === "checkbox") {
				initial[field.id] = field.defaultValue ?? false;
			}
		}
		return initial;
	});

	const valuesRef = useRef(values);
	valuesRef.current = values;

	const setValue = (id: string, value: string | boolean) => {
		setValues((prev) => ({ ...prev, [id]: value }));
	};

	const handleSubmit = () => {
		onSubmit(valuesRef.current);
	};

	return (
		<Box flexDirection="column" gap={0}>
			{fields.map((field, index) => {
				const isFirst = index === 0;
				if (field.type === "text") {
					return (
						<TextField
							key={field.id}
							field={field}
							onChange={(v) => setValue(field.id, v)}
							autoFocus={isFirst}
						/>
					);
				}
				if (field.type === "checkbox") {
					return (
						<CheckboxField
							key={field.id}
							field={field}
							value={values[field.id] as boolean}
							onChange={(v) => setValue(field.id, v)}
							autoFocus={isFirst}
						/>
					);
				}
				return null;
			})}
			<Box marginTop={1}>
				<SubmitButton
					label={submitLabel}
					submitting={submitting}
					onSubmit={handleSubmit}
				/>
			</Box>
			{error && (
				<Box marginTop={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}
		</Box>
	);
}
