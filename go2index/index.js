// =======Options START=======
var  authConfig  =  {
  siteName : "Chillx",  // site name
  version : "1.1.2" ,  // program version
  theme: "acrou",
  // It is strongly recommended to use your own client_id and client_secret
  client_id: "746239575955-oao9hkv614p8glrqpvuh5i8mqfoq145b.apps.googleusercontent.com", // Client id from Google Cloud Console
    client_secret: "u5a1CSY5pNjdD2tGTU93TTnI",
    refresh_token: "", // Authorize token
  /*
   * Set multiple drives to be displayed; add multiple by format
   * [id]: Can be team disk id, subfolder id, or "root" (representing the root directory of personal disk);
   * [name]: Displayed name
   * [user]: Basic Auth username
   * [pass]: Basic Auth password
   * [protect_file_link]: Whether Basic Auth is used to protect the file link, the default value (when not set) is false, that is, the file link is not protected (for direct link download/external playback, etc.)
   * The Basic Auth of each disk can be set separately. Basic Auth protects all folders/subfolders paths under this disk by default
   * [Note] File links are not protected by default, which can facilitate direct link download/external playback;
   * If you want to protect the file link, you need to set protect_file_link to true. If you want to perform external playback and other operations, you need to replace host with user:pass@host
   * No Basic Auth disk is needed, just keep user and pass empty at the same time. (It can be set directly without setting)
   * [Note] The search function is not supported for the disk whose id is set as the subfolder id (it does not affect other disks).
   */
  roots: [
    {
      id: "",
      name: "TeamDrive",
      pass: "",
    },
    {
      id: "root",
      name: "PrivateDrive",
      user: "",
      pass: "",
      protect_file_link: true,
    },
    {
      id: "",
      name: "folder1",
      pass: "",
    },
  ],
  default_gd: 0,
	/**
	    * The number displayed on each page of the file list page. [The recommended setting is between 100 and 1000];
	    * If the setting is greater than 1000, it will cause an error when requesting drive api;
	    * If the set value is too small, it will cause the incremental loading of the scroll bar of the file list page (paged loading) to fail;
	    * Another effect of this value is that if the number of files in the directory is greater than this setting value (that is, multiple pages are required), the results of the first directory listing will be cached.
	    */
  files_list_page_size: 50,
	/**
	    * The number displayed on each page of the search result page. [The recommended setting is between 50 and 1000];
	    * If the setting is greater than 1000, it will cause an error when requesting drive api;
	    * If the value set is too small, it will cause the incremental loading of the scroll bar of the search results page (paged loading) to fail;
	    * The size of this value affects the response speed of search operations.
	    */
  search_result_list_page_size: 50,
// Confirm that cors can be opened
  enable_cors_file_down: false,
	/**
	    * The basic auth above already includes the function of global protection in the disk. Therefore, the password in the .password file is no longer authenticated by default;
	    * If on the basis of global authentication, you still need to separately verify the password in the .password file for some directories, set this option to true;
	    * [Note] If the password verification of the .password file is enabled, every time the directory is listed, the overhead of querying whether the .password file exists in the directory will be added.
	    */
  enable_password_file_verify: false,
};
var themeOptions = {
  cdn: "https://cdn.jsdelivr.net/gh/shejige/goindex-theme-acrou",
// Theme version number
  version: "2.0.8",
//Optional default system language: en/zh-chs/zh-cht
  languages: "en",
  render: {
		/**
		      * Whether to render the HEAD.md file
		      * Render HEAD.md file
		      */
    head_md: false,
		/**
		      * Whether to render the README.md file
		      * Render README.md file
		      */
    readme_md: false,
		/**
		      * Whether to render file/folder description
		      * Render file/folder description or not
		      */
    desc: false,
  },
	/**
	    * Video player options
	    * Video player options
	    */
  video: {
		/**
		      * Player api (if not specified, the default player will be used)
		      * Player api(Use default player if not specified)
		      */
    api: "",
    autoplay: true,
  },
	/**
	    * Audio player options
	    * Audio player options
	    */
  audio: {},
};
// =======Options END=======

/**
 * global functions
 */
const FUNCS = {
  /**
	 * Converted into relatively safe search keywords for Google search lexicon
   */
  formatSearchKeyword: function(keyword) {
    let nothing = "";
    let space = " ";
    if (!keyword) return nothing;
    return keyword
      .replace(/(!=)|['"=<>/\\:]/g, nothing)
      .replace(/[,，|(){}]/g, space)
      .trim();
  },
};

/**
 * global consts
 * @type {{folder_mime_type: string, default_file_fields: string, gd_root_type: {share_drive: number, user_drive: number, sub_folder: number}}}
 */
const CONSTS = new (class {
  default_file_fields =
    "parents,id,name,mimeType,modifiedTime,createdTime,fileExtension,size";
  gd_root_type = {
    user_drive: 0,
    share_drive: 1,
    sub_folder: 2,
  };
  folder_mime_type = "application/vnd.google-apps.folder";
})();

// gd instances
var gds = [];

function html(current_drive_order = 0, model = {}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"> 
<meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"/> 
<link rel="icon" type="image/png" sizes="32x32" href="https://i.imgur.com/rOyuGjA.gif">
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-86099016-6">
</script>
<script>window.dataLayer=window.dataLayer || []; function gtag(){dataLayer.push(arguments);}gtag('js', new Date()); gtag('config', 'UA-86099016-6');</script>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MR47R4M');</script> 
  <title>${authConfig.siteName}</title>
  <style>
    @import url(${themeOptions.cdn}@${themeOptions.version}/dist/style.min.css);
  </style>
  <script>
    window.gdconfig = JSON.parse('${JSON.stringify({
      version: authConfig.version,
      themeOptions: themeOptions,
    })}');
    window.themeOptions = JSON.parse('${JSON.stringify(themeOptions)}');
    window.gds = JSON.parse('${JSON.stringify(
      authConfig.roots.map((it) => it.name)
    )}');
    window.MODEL = JSON.parse('${JSON.stringify(model)}');
    window.current_drive_order = ${current_drive_order};
  </script>
</head>
<body>
    <div id="app"></div>
    <script src="${themeOptions.cdn}@${
    themeOptions.version
  }/dist/app.min.js">
  </script>
</body>
</html>
`;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
  if (gds.length === 0) {
    for (let i = 0; i < authConfig.roots.length; i++) {
      const gd = new googleDrive(authConfig, i);
      await gd.init();
      gds.push(gd);
    }
// This operation is parallel to improve efficiency
    let tasks = [];
    gds.forEach((gd) => {
      tasks.push(gd.initRootType());
    });
    for (let task of tasks) {
      await task;
    }
  }

	// Extract drive order from path
	   // and get the corresponding gd instance according to drive order
  let gd;
  let url = new URL(request.url);
  let path = decodeURI(url.pathname);

  /**
* Redirect to the start page
   * @returns {Response}
   */
  function redirectToIndexPage() {
    return new Response("", {
      status: 301,
      headers: { Location: `/${authConfig.default_gd}:/` },
    });
  }

  if (path == "/") return redirectToIndexPage();
  if (path.toLowerCase() == "/favicon.ico") {
// You can find a favicon later
    return new Response("", { status: 404 });
  }

// Special command format
  const command_reg = /^\/(?<num>\d+):(?<command>[a-zA-Z0-9]+)(\/.*)?$/g;
  const match = command_reg.exec(path);
  let command;
  if (match) {
    const num = match.groups.num;
    const order = Number(num);
    if (order >= 0 && order < gds.length) {
      gd = gds[order];
    } else {
      return redirectToIndexPage();
    }
    // basic auth
    for (const r = gd.basicAuthResponse(request); r; ) return r;
    command = match.groups.command;

// search for
    if (command === "search") {
      if (request.method === "POST") {
// search results
        return handleSearch(request, gd);
      } else {
        const params = url.searchParams;
// search page
        return new Response(
          html(gd.order, {
            q: params.get("q") || "",
            is_search_page: true,
            root_type: gd.root_type,
          }),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    } else if (command === "id2path" && request.method === "POST") {
      return handleId2Path(request, gd);
    } else if (command === "view") {
      const params = url.searchParams;
      return gd.view(params.get("url"), request.headers.get("Range"));
    } else if (command !== "down" && request.method === "GET") {
      return new Response(html(gd.order, { root_type: gd.root_type }), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }
  const reg = new RegExp(`^(/\\d+:)${command}/`, "g");
  path = path.replace(reg, (p1, p2) => {
    return p2 + "/";
  });
// Expected path format
  const common_reg = /^\/\d+:\/.*$/g;
  try {
    if (!path.match(common_reg)) {
      return redirectToIndexPage();
    }
    let split = path.split("/");
    let order = Number(split[1].slice(0, -1));
    if (order >= 0 && order < gds.length) {
      gd = gds[order];
    } else {
      return redirectToIndexPage();
    }
  } catch (e) {
    return redirectToIndexPage();
  }

  // basic auth
  // for (const r = gd.basicAuthResponse(request); r;) return r;
  const basic_auth_res = gd.basicAuthResponse(request);
  path = path.replace(gd.url_path_prefix, "") || "/";
  if (request.method == "POST") {
    return basic_auth_res || apiRequest(request, gd);
  }

  let action = url.searchParams.get("a");

  if (path.substr(-1) == "/" || action != null) {
    return (
      basic_auth_res ||
      new Response(html(gd.order, { root_type: gd.root_type }), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );
  } else {
    if (
      path
        .split("/")
        .pop()
        .toLowerCase() == ".password"
    ) {
      return basic_auth_res || new Response("", { status: 404 });
    }
    let file = await gd.file(path);
    let range = request.headers.get("Range");
    if (gd.root.protect_file_link && basic_auth_res) return basic_auth_res;
    const is_down = !(command && command == "down");
    return gd.down(file.id, range, is_down);
  }
}

async function apiRequest(request, gd) {
  let url = new URL(request.url);
  let path = url.pathname;
  path = path.replace(gd.url_path_prefix, "") || "/";

  let option = { status: 200, headers: { "Access-Control-Allow-Origin": "*" } };

  if (path.substr(-1) == "/") {
    let deferred_pass = gd.password(path);
    let body = await request.text();
    body = JSON.parse(body);
// This can increase the speed when listing the directory for the first time. The disadvantage is that if the password verification fails, the overhead of listing directories will still be incurred
    let deferred_list_result = gd.list(
      path,
      body.page_token,
      Number(body.page_index)
    );

    // check .password file, if `enable_password_file_verify` is true
    if (authConfig["enable_password_file_verify"]) {
      let password = await gd.password(path);
      // console.log("dir password", password);
      if (password && password.replace("\n", "") !== body.password) {
        let html = `{"error": {"code": 401,"message": "password error."}}`;
        return new Response(html, option);
      }
    }

    let list_result = await deferred_list_result;
    return new Response(JSON.stringify(list_result), option);
  } else {
    let file = await gd.file(path);
    let range = request.headers.get("Range");
    return new Response(JSON.stringify(file));
  }
}

// process search
async function handleSearch(request, gd) {
  const option = {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
  };
  let body = await request.text();
  body = JSON.parse(body);
  let search_result = await gd.search(
    body.q || "",
    body.page_token,
    Number(body.page_index)
  );
  return new Response(JSON.stringify(search_result), option);
}

/**
* Process id2path
 * @param request Require id parameter
 * @param gd
 * @returns {Promise<Response>} [Note] If the item represented by the id received from the front desk is not under the target gd disk, the response will return an empty string "" to the front desk
 */
async function handleId2Path(request, gd) {
  const option = {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
  };
  let body = await request.text();
  body = JSON.parse(body);
  let path = await gd.findPathById(body.id);
  return new Response(path || "", option);
}

class googleDrive {
  constructor(authConfig, order) {
    // Each disk corresponds to an order, corresponding to a gd instance
    this.order = order;
    this.root = authConfig.roots[order];
    this.root.protect_file_link = this.root.protect_file_link || false;
    this.url_path_prefix = `/${order}:`;
    this.authConfig = authConfig;
    // TODO: These cache invalidation refresh strategies can be formulated later
    // path id
    this.paths = [];
    // path file
    this.files = [];
    // path pass
    this.passwords = [];
    // id <-> path
    this.id_path_cache = {};
    this.id_path_cache[this.root["id"]] = "/";
    this.paths["/"] = this.root["id"];
    /*if (this.root['pass'] != "") {
            this.passwords['/'] = this.root['pass'];
        }*/
    // this.init();
  }

  /**
   * Initial authorization; then get user_drive_real_root_id
   * @returns {Promise<void>}
   */
  async init() {
    await this.accessToken();
		/*await (async () => {
		             // Only get 1 time
		             if (authConfig.user_drive_real_root_id) return;
		             const root_obj = await (gds[0] || this).findItemById('root');
		             if (root_obj && root_obj.id) {
		                 authConfig.user_drive_real_root_id = root_obj.id
		             }
		         })();*/
		     // Wait for user_drive_real_root_id, only get it once
    if (authConfig.user_drive_real_root_id) return;
    const root_obj = await (gds[0] || this).findItemById("root");
    if (root_obj && root_obj.id) {
      authConfig.user_drive_real_root_id = root_obj.id;
    }
  }

  /**
   * Get the root directory type, set to root_type
   * @returns {Promise<void>}
   */
  async initRootType() {
    const root_id = this.root["id"];
    const types = CONSTS.gd_root_type;
    if (root_id === "root" || root_id === authConfig.user_drive_real_root_id) {
      this.root_type = types.user_drive;
    } else {
      const obj = await this.getShareDriveObjById(root_id);
      this.root_type = obj ? types.share_drive : types.sub_folder;
    }
  }

  /**
   * Returns a response that requires authorization, or null
   * @param request
   * @returns {Response|null}
   */
  basicAuthResponse(request) {
    const user = this.root.user || "",
      pass = this.root.pass || "",
      _401 = new Response("Unauthorized", {
        headers: {
          "WWW-Authenticate": `Basic realm="goindex:drive:${this.order}"`,
        },
        status: 401,
      });
    if (user || pass) {
      const auth = request.headers.get("Authorization");
      if (auth) {
        try {
          const [received_user, received_pass] = atob(
            auth.split(" ").pop()
          ).split(":");
          return received_user === user && received_pass === pass ? null : _401;
        } catch (e) {}
      }
    } else return null;
    return _401;
  }

  async view(url, range = "", inline = true) {
    let requestOption = await this.requestOption();
    requestOption.headers["Range"] = range;
    let res = await fetch(url, requestOption);
    const { headers } = (res = new Response(res.body, res));
    this.authConfig.enable_cors_file_down &&
      headers.append("Access-Control-Allow-Origin", "*");
    inline === true && headers.set("Content-Disposition", "inline");
    return res;
  }

  async down(id, range = "", inline = false) {
    let url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    let requestOption = await this.requestOption();
    requestOption.headers["Range"] = range;
    let res = await fetch(url, requestOption);
    const { headers } = (res = new Response(res.body, res));
    this.authConfig.enable_cors_file_down &&
      headers.append("Access-Control-Allow-Origin", "*");
    inline === true && headers.set("Content-Disposition", "inline");
    return res;
  }

  async file(path) {
    if (typeof this.files[path] == "undefined") {
      this.files[path] = await this._file(path);
    }
    return this.files[path];
  }

  async _file(path) {
    let arr = path.split("/");
    let name = arr.pop();
    name = decodeURIComponent(name).replace(/\'/g, "\\'");
    let dir = arr.join("/") + "/";
    // console.log(name, dir);
    let parent = await this.findPathId(dir);
    // console.log(parent);
    let url = "https://www.googleapis.com/drive/v3/files";
    let params = { includeItemsFromAllDrives: true, supportsAllDrives: true };
    params.q = `'${parent}' in parents and name = '${name}' and trashed = false`;
    params.fields =
      "files(id, name, mimeType, size ,createdTime, modifiedTime, iconLink, thumbnailLink)";
    url += "?" + this.enQuery(params);
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    let obj = await response.json();
    // console.log(obj);
    return obj.files[0];
  }

// Cache through reqeust cache
  async list(path, page_token = null, page_index = 0) {
    if (this.path_children_cache == undefined) {
      // { <path> :[ {nextPageToken:'',data:{}}, {nextPageToken:'',data:{}} ...], ...}
      this.path_children_cache = {};
    }

    if (
      this.path_children_cache[path] &&
      this.path_children_cache[path][page_index] &&
      this.path_children_cache[path][page_index].data
    ) {
      let child_obj = this.path_children_cache[path][page_index];
      return {
        nextPageToken: child_obj.nextPageToken || null,
        curPageIndex: page_index,
        data: child_obj.data,
      };
    }

    let id = await this.findPathId(path);
    let result = await this._ls(id, page_token, page_index);
    let data = result.data;
    // Cache for multiple pages
    if (result.nextPageToken && data.files) {
      if (!Array.isArray(this.path_children_cache[path])) {
        this.path_children_cache[path] = [];
      }
      this.path_children_cache[path][Number(result.curPageIndex)] = {
        nextPageToken: result.nextPageToken,
        data: data,
      };
    }

    return result;
  }

  async _ls(parent, page_token = null, page_index = 0) {
    // console.log("_ls", parent);

    if (parent == undefined) {
      return null;
    }
    let obj;
    let params = { includeItemsFromAllDrives: true, supportsAllDrives: true };
    params.q = `'${parent}' in parents and trashed = false AND name !='.password'`;
    params.orderBy = "folder,name,modifiedTime desc";
    params.fields =
      "nextPageToken, files(id, name, mimeType, size , modifiedTime, thumbnailLink, description)";
    params.pageSize = this.authConfig.files_list_page_size;

    if (page_token) {
      params.pageToken = page_token;
    }
    let url = "https://www.googleapis.com/drive/v3/files";
    url += "?" + this.enQuery(params);
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    obj = await response.json();

    return {
      nextPageToken: obj.nextPageToken || null,
      curPageIndex: page_index,
      data: obj,
    };

    /*do {
            if (pageToken) {
                params.pageToken = pageToken;
            }
            let url = 'https://www.googleapis.com/drive/v3/files';
            url += '?' + this.enQuery(params);
            let requestOption = await this.requestOption();
            let response = await fetch(url, requestOption);
            obj = await response.json();
            files.push(...obj.files);
            pageToken = obj.nextPageToken;
        } while (pageToken);*/
  }

  async password(path) {
    if (this.passwords[path] !== undefined) {
      return this.passwords[path];
    }

    // console.log("load", path, ".password", this.passwords[path]);

    let file = await this.file(path + ".password");
    if (file == undefined) {
      this.passwords[path] = null;
    } else {
      let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      let requestOption = await this.requestOption();
      let response = await this.fetch200(url, requestOption);
      this.passwords[path] = await response.text();
    }

    return this.passwords[path];
  }

  /**
   * Get share drive information by id
   * @param any_id
   * @returns {Promise<null|{id}|any>} Any abnormal situation returns null
   */
  async getShareDriveObjById(any_id) {
    if (!any_id) return null;
    if ("string" !== typeof any_id) return null;

    let url = `https://www.googleapis.com/drive/v3/drives/${any_id}`;
    let requestOption = await this.requestOption();
    let res = await fetch(url, requestOption);
    let obj = await res.json();
    if (obj && obj.id) return obj;

    return null;
  }

  /**
   * search for
   * @returns {Promise<{data: null, nextPageToken: null, curPageIndex: number}>}
   */
  async search(origin_keyword, page_token = null, page_index = 0) {
    const types = CONSTS.gd_root_type;
    const is_user_drive = this.root_type === types.user_drive;
    const is_share_drive = this.root_type === types.share_drive;

    const empty_result = {
      nextPageToken: null,
      curPageIndex: page_index,
      data: null,
    };

    if (!is_user_drive && !is_share_drive) {
      return empty_result;
    }
    let keyword = FUNCS.formatSearchKeyword(origin_keyword);
    if (!keyword) {
      // Keyword is empty, return
      return empty_result;
    }
    let words = keyword.split(/\s+/);
    let name_search_str = `name contains '${words.join(
      "' AND name contains '"
    )}'`;

    // For corpora, user is a personal disk, and drive is a team disk. Match driveId
    let params = {};
    if (is_user_drive) {
      params.corpora = "user";
    }
    if (is_share_drive) {
      params.corpora = "drive";
      params.driveId = this.root.id;
      // This parameter will only be effective until June 1, 2020. Afterwards shared drive items will be included in the results.
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
    }
    if (page_token) {
      params.pageToken = page_token;
    }
    params.q = `trashed = false AND name !='.password' AND (${name_search_str})`;
    params.fields =
      "nextPageToken, files(id, name, mimeType, size , modifiedTime, thumbnailLink, description)";
    params.pageSize = this.authConfig.search_result_list_page_size;
    // params.orderBy = 'folder,name,modifiedTime desc';

    let url = "https://www.googleapis.com/drive/v3/files";
    url += "?" + this.enQuery(params);
    // console.log(params)
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    let res_obj = await response.json();

    return {
      nextPageToken: res_obj.nextPageToken || null,
      curPageIndex: page_index,
      data: res_obj,
    };
  }

	/**
	    * Get the file object of the parent folder of this file or folder upwards one by one. Note: it will be slow! ! !
	    * Up to find the root directory of the current gd object (root id)
	    * Only consider a single upward chain.
	    * [Note] If the item represented by this id is not under the target gd disk, then this function will return null
	    *
	    * @param child_id
	    * @param contain_myself
	    * @returns {Promise<[]>}
	    */
  async findParentFilesRecursion(child_id, contain_myself = true) {
    const gd = this;
    const gd_root_id = gd.root.id;
    const user_drive_real_root_id = authConfig.user_drive_real_root_id;
    const is_user_drive = gd.root_type === CONSTS.gd_root_type.user_drive;

    // End goal id for bottom-up query
    const target_top_id = is_user_drive ? user_drive_real_root_id : gd_root_id;
    const fields = CONSTS.default_file_fields;

    // [{},{},...]
    const parent_files = [];
    let meet_top = false;

    async function addItsFirstParent(file_obj) {
      if (!file_obj) return;
      if (!file_obj.parents) return;
      if (file_obj.parents.length < 1) return;

      // ['','',...]
      let p_ids = file_obj.parents;
      if (p_ids && p_ids.length > 0) {
        // its first parent
        const first_p_id = p_ids[0];
        if (first_p_id === target_top_id) {
          meet_top = true;
          return;
        }
        const p_file_obj = await gd.findItemById(first_p_id);
        if (p_file_obj && p_file_obj.id) {
          parent_files.push(p_file_obj);
          await addItsFirstParent(p_file_obj);
        }
      }
    }

    const child_obj = await gd.findItemById(child_id);
    if (contain_myself) {
      parent_files.push(child_obj);
    }
    await addItsFirstParent(child_obj);

    return meet_top ? parent_files : null;
  }

  /**
   * Get the path relative to the root directory of the disk
   * @param child_id
   * @returns {Promise<string>} [Note] If the item represented by this id is not in the target gd disk, then this method will return an empty string ""
   */
  async findPathById(child_id) {
    if (this.id_path_cache[child_id]) {
      return this.id_path_cache[child_id];
    }

    const p_files = await this.findParentFilesRecursion(child_id);
    if (!p_files || p_files.length < 1) return "";

    let cache = [];
    // Cache the path and id of each level found
    p_files.forEach((value, idx) => {
      const is_folder =
        idx === 0 ? p_files[idx].mimeType === CONSTS.folder_mime_type : true;
      let path =
        "/" +
        p_files
          .slice(idx)
          .map((it) => it.name)
          .reverse()
          .join("/");
      if (is_folder) path += "/";
      cache.push({ id: p_files[idx].id, path: path });
    });

    cache.forEach((obj) => {
      this.id_path_cache[obj.id] = obj.path;
      this.paths[obj.path] = obj.id;
    });

    /*const is_folder = p_files[0].mimeType === CONSTS.folder_mime_type;
        let path = '/' + p_files.map(it => it.name).reverse().join('/');
        if (is_folder) path += '/';*/

    return cache[0].path;
  }

  // Get file item according to id
  async findItemById(id) {
    const is_user_drive = this.root_type === CONSTS.gd_root_type.user_drive;
    let url = `https://www.googleapis.com/drive/v3/files/${id}?fields=${
      CONSTS.default_file_fields
    }${is_user_drive ? "" : "&supportsAllDrives=true"}`;
    let requestOption = await this.requestOption();
    let res = await fetch(url, requestOption);
    return await res.json();
  }

  async findPathId(path) {
    let c_path = "/";
    let c_id = this.paths[c_path];

    let arr = path.trim("/").split("/");
    for (let name of arr) {
      c_path += name + "/";

      if (typeof this.paths[c_path] == "undefined") {
        let id = await this._findDirId(c_id, name);
        this.paths[c_path] = id;
      }

      c_id = this.paths[c_path];
      if (c_id == undefined || c_id == null) {
        break;
      }
    }
    // console.log(this.paths);
    return this.paths[path];
  }

  async _findDirId(parent, name) {
    name = decodeURIComponent(name).replace(/\'/g, "\\'");

    // console.log("_findDirId", parent, name);

    if (parent == undefined) {
      return null;
    }

    let url = "https://www.googleapis.com/drive/v3/files";
    let params = { includeItemsFromAllDrives: true, supportsAllDrives: true };
    params.q = `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}'  and trashed = false`;
    params.fields = "nextPageToken, files(id, name, mimeType)";
    url += "?" + this.enQuery(params);
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    let obj = await response.json();
    if (obj.files[0] == undefined) {
      return null;
    }
    return obj.files[0].id;
  }

  async accessToken() {
    console.log("accessToken");
    if (
      this.authConfig.expires == undefined ||
      this.authConfig.expires < Date.now()
    ) {
      const obj = await this.fetchAccessToken();
      if (obj.access_token != undefined) {
        this.authConfig.accessToken = obj.access_token;
        this.authConfig.expires = Date.now() + 3500 * 1000;
      }
    }
    return this.authConfig.accessToken;
  }

  async fetchAccessToken() {
    console.log("fetchAccessToken");
    const url = "https://www.googleapis.com/oauth2/v4/token";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const post_data = {
      client_id: this.authConfig.client_id,
      client_secret: this.authConfig.client_secret,
      refresh_token: this.authConfig.refresh_token,
      grant_type: "refresh_token",
    };

    let requestOption = {
      method: "POST",
      headers: headers,
      body: this.enQuery(post_data),
    };

    const response = await fetch(url, requestOption);
    return await response.json();
  }

  async fetch200(url, requestOption) {
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      console.log(response.status);
      if (response.status != 403) {
        break;
      }
      await this.sleep(800 * (i + 1));
    }
    return response;
  }

  async requestOption(headers = {}, method = "GET") {
    const accessToken = await this.accessToken();
    headers["authorization"] = "Bearer " + accessToken;
    return { method: method, headers: headers };
  }

  enQuery(data) {
    const ret = [];
    for (let d in data) {
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    }
    return ret.join("&");
  }

  sleep(ms) {
    return new Promise(function(resolve, reject) {
      let i = 0;
      setTimeout(function() {
        console.log("sleep" + ms);
        i++;
        if (i >= 2) reject(new Error("i>=2"));
        else resolve(i);
      }, ms);
    });
  }
}

String.prototype.trim = function(char) {
  if (char) {
    return this.replace(
      new RegExp("^\\" + char + "+|\\" + char + "+$", "g"),
      ""
    );
  }
  return this.replace(/^\s+|\s+$/g, "");
};