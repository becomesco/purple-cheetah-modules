const childProcess = require("child_process");
const path = require("path");
const fse = require("fs-extra");
const fs = require("fs");
const util = require("util");

/**
 * @typedef {{
 *  title: string
 *  task: (function(): Promise<void>)
 * }} Task
 */

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {import('child_process').SpawnOptions?} options
 */
async function spawn(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const proc = childProcess.spawn(
      cmd,
      args,
      options
        ? options
        : {
            stdio: "inherit",
          }
    );
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve();
      }
    });
  });
}
/**
 * @param {Task[]} tasks
 */
function Tasks(tasks) {
  return {
    run: async () => {
      for (let i = 0; i < tasks.length; i = i + 1) {
        const t = tasks[i];
        console.log(`${i + 1}. ${t.title}`);
        try {
          await t.task();
          console.log(`✓`);
        } catch (error) {
          console.log(`⨉`);
          throw error;
        }
      }
    },
  };
}
function parseArgs(rawArgs) {
  const args = {};
  let i = 2;
  while (i < rawArgs.length) {
    const arg = rawArgs[i];
    let value = "";
    if (rawArgs[i + 1]) {
      value = rawArgs[i + 1].startsWith("--") ? "" : rawArgs[i + 1];
    }
    args[arg] = value;
    if (value === "") {
      i = i + 1;
    } else {
      i = i + 2;
    }
  }
  return {
    bundle: args["--bundle"] === "" || args["--bundle"] === "true" || false,
    link: args["--link"] === "" || args["--link"] === "true" || false,
    unlink: args["--unlink"] === "" || args["--unlink"] === "true" || false,
    publish: args["--publish"] === "" || args["--publish"] === "true" || false,
    build: args["--build"] === "" || args["--build"] === "true" || false,
    sudo: args["--sudo"] === "" || args["--sudo"] === "true" || false,
    pack: args["--pack"] === "" || args["--pack"] === "true" || false,
    mod: args["--mod"] !== "" ? args["--mod"] : undefined,
  };
}

/**
 * @param {string} mod
 * @returns {Promise<void>}
 */
async function bundle(mod) {
  const tasks = new Tasks([
    {
      title: "Remove old bundle.",
      task: async () => {
        await fse.remove(path.join(__dirname, mod, "dist"));
      },
    },
    {
      title: "Compile Typescript.",
      task: async () => {
        await spawn("npm", ["run", "build"], {
          stdio: "inherit",
          cwd: path.join(__dirname, mod),
        });
      },
    },
    {
      title: "Copy package.json",
      task: async () => {
        const data = JSON.parse(
          (
            await util.promisify(fs.readFile)(
              path.join(__dirname, mod, "package.json")
            )
          ).toString()
        );
        data.devDependencies = undefined;
        data.nodemonConfig = undefined;
        data.scripts = undefined;
        await util.promisify(fs.writeFile)(
          path.join(__dirname, mod, "dist", "package.json"),
          JSON.stringify(data, null, "  ")
        );
      },
    },
    {
      title: "Copy LICENSE",
      task: async () => {
        await fse.copy(
          path.join(__dirname, "LICENSE"),
          path.join(__dirname, mod, "dist", "LICENSE")
        );
      },
    },
    {
      title: "Copy README.md",
      task: async () => {
        await fse.copy(
          path.join(__dirname, mod, "README.md"),
          path.join(__dirname, mod, "dist", "README.md")
        );
      },
    },
  ]);
  await tasks.run();
}

/**
 * @param {string} mod
 * @returns {Promise<void>}
 */
async function pack(mod) {
  await spawn("npm", ["pack"], {
    cwd: path.join(process.cwd(), mod, "dist"),
    stdio: "inherit",
  });
}
/**
 * @param {boolean} sudo
 * @param {string} mod
 * @returns {Promise<void>}
 */
async function link(sudo, mod) {
  await spawn("npm", ["i"], {
    cwd: path.join(process.cwd(), mod, "dist"),
    stdio: "inherit",
  });
  if (sudo) {
    await spawn("sudo", ["npm", "link"], {
      cwd: path.join(process.cwd(), "dist"),
      stdio: "inherit",
    });
  } else {
    await spawn("npm", ["link"], {
      cwd: path.join(process.cwd(), "dist"),
      stdio: "inherit",
    });
  }
}
/**
 * @param {boolean} sudo
 * @param {string} mod
 * @returns {Promise<void>}
 */
async function unlink(sudo, mod) {
  if (sudo) {
    await spawn("sudo", ["npm", "link"], {
      cwd: path.join(process.cwd(), mod, "dist"),
      stdio: "inherit",
    });
  } else {
    await spawn("npm", ["unlink"], {
      cwd: path.join(process.cwd(), mod, "dist"),
      stdio: "inherit",
    });
  }
}

/**
 * @param {string} mod
 * @returns {Promise<void>}
 */
async function publish(mod) {
  if (
    await util.promisify(fs.exists)(
      path.join(__dirname, mod, "dist", "node_modules")
    )
  ) {
    throw new Error(
      `Please remove "${path.join(__dirname, mod, "dist", "node_modules")}"`
    );
  }
  await spawn("npm", ["publish", "--access=private"], {
    cwd: path.join(process.cwd(), mod, "dist"),
    stdio: "inherit",
  });
}
async function main() {
  const options = parseArgs(process.argv);
  let mods = [
    "fsdb",
    "graphql",
    "ip-protection",
    "jwt",
    "mem-cache",
    "mongodb",
    "socket",
  ];
  if (options.mod) {
    mods = mods.filter((e) => e === options.mod);
  }
  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i];
    if (options.bundle === true) {
      await bundle(mod);
    } else if (options.link === true) {
      await link(options.sudo, mod);
    } else if (options.unlink === true) {
      await unlink(options.sudo, mod);
    } else if (options.publish === true) {
      await publish(mod);
    } else if (options.pack === true) {
      await pack(mod);
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
