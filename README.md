# Mosaia Tool Starter
A demo implementation of a Mosaia Tool.

## Getting Started
1. Register for an account on mosaia.ai
2. Fork/copy this repo
3. Install the GitHub app to the repo by clicking the "Launch App" button on: https://mosaia.ai/org/mosaia/app/github
4. Fill out the `.mosaia` manifest file:
- `TOOL_DISPLAY_NAME`: (user-facing) The name of the tool, displayed on the Mosaia Tool Registry. Must be unique.
- `SHORT_TOOL_DESCRIPTION`: (user-facing) A one-sentence description of the tool, displayed in the Mosaia Tool Registry.
- `LONG_TOOL_DESCRIPTION`: (llm-facing) A longer description of what the tool does.
- `EXAMPLE_PARAM_ONE`, etc. (llm-facing): Any params you wish the LLM to pass to your tool.
- `EXAMPLE_PARAM_ONE_DESCRIPTION`, etc.: (llm-facing) Descriptions of each param and what they're for.
- `ENV_VAR_ONE`: (user-facing): When a user adds your tool to their agent they will be asked to supply values to the keys listed in `envVars`.
5. Validate your `.mosaia` manifest file: `npm run validate:manifest`
6. (Optional) test your tool locally: `npm run start:dev` in one terminal and `npm run test:request` in another. A Postman collection has also been provided with a test request.
7. Push your changes to `main`. Once pushed, the deployment script will kick off. You should see your tool show up in `https://mosaia.ai/user/YOUR_USERNAME?tab=tools` in about a minute.
8. Add your tool to an agent to test it out.

## Manifest Validation
The project includes a validation script that checks your `.mosaia` manifest file against the required schema:

```bash
npm run validate:manifest
```

This script validates:
- **name**: Must be a string with minimum length 5, containing only alphanumeric characters and spaces
- **description**: Must be a string with minimum length 30
- **schema.type**: Must be "function"
- **schema.function.name**: Must be a string with minimum length 5
- **schema.function.description**: Must be a string with minimum length 30
- **schema.function.strict**: Must be a boolean (optional)
- **schema.function.parameters**: Must be a valid JSON schema object
- **envVars**: Must be an array of strings (optional)

See `.mosaia.example` for a valid manifest file structure.

## Minimum requirements
The only requirements for a Mosaia Tool are that it:
1. contains a valid `.mosaia` file
2. defines an npm `build` command
3. `npm run build` emits transpiled code into a `dist` directory
4. the entrypoint of the trainspiled code is `dist/index.js`.
# slack1
