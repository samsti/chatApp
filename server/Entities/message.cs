using System;
using System.Collections.Generic;

namespace server.Entities;

public partial class message
{
    public string id { get; set; } = null!;

    public string content { get; set; } = null!;

    public string user_id { get; set; } = null!;

    public string room_id { get; set; } = null!;

    public DateTime created_at { get; set; }

    public virtual room room { get; set; } = null!;

    public virtual user user { get; set; } = null!;
}
