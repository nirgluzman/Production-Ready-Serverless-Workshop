/**
 * Local Variables
 *
 * This file defines local variables that are computed from input variables and used throughout the Terraform configuration.
 */

locals {
  # Determine which stage name to use for SSM parameter paths.
  # Use coalesce to pick the first non-null value - if ssm_stage_name is provided, use that value; otherwise fall back to the main stage_name.
  # This allows for flexible parameter organization strategies where multiple environments might share the same configuration parameters.
  ssm_stage_name = coalesce(var.ssm_stage_name, var.stage_name)

  # Determine if this is an end-to-end test environment.
  # Returns true if the stage name starts with "dev" (e.g., dev, dev-ci, dev-feature-branch).
  # Used to conditionally enable/disable resources or configurations for testing environments.
  is_e2e_test = startswith(var.stage_name, "dev")
}
